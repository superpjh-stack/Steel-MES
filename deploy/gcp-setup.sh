#!/usr/bin/env bash
# ============================================================
# Steel-MES — GCP 최초 배포 셋업 스크립트
# 실행 전: gcloud auth login && gcloud auth application-default login
# ============================================================
set -euo pipefail

# ── 설정값 (환경에 맞게 수정) ────────────────────────────────
PROJECT_ID=""                         # 예: my-company-mes
REGION="asia-northeast3"              # 서울 리전
SERVICE="steel-mes"
DB_INSTANCE="steel-mes-db"
DB_NAME="mes_db"
DB_USER="mes_user"
DB_PASSWORD=""                        # 강력한 비밀번호 입력
NEXTAUTH_SECRET=""                    # 32자 이상 랜덤 문자열
NEXTAUTH_URL=""                       # 예: https://steel-mes-xxxx-du.a.run.app

# ── 값 검증 ──────────────────────────────────────────────────
if [[ -z "$PROJECT_ID" || -z "$DB_PASSWORD" || -z "$NEXTAUTH_SECRET" || -z "$NEXTAUTH_URL" ]]; then
  echo "❌ 스크립트 상단의 설정값을 모두 입력하세요."
  exit 1
fi

echo "▶ 프로젝트 설정: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# ── API 활성화 ────────────────────────────────────────────────
echo "▶ GCP API 활성화..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID"

# ── Artifact Registry 저장소 생성 ────────────────────────────
echo "▶ Artifact Registry 생성..."
gcloud artifacts repositories create steel-mes \
  --repository-format=docker \
  --location="$REGION" \
  --description="Steel-MES Docker images" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (이미 존재)"

# ── Cloud SQL (PostgreSQL 16) 생성 ───────────────────────────
echo "▶ Cloud SQL 인스턴스 생성 (약 5~10분 소요)..."
gcloud sql instances create "$DB_INSTANCE" \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region="$REGION" \
  --storage-auto-increase \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (이미 존재)"

echo "▶ DB 생성..."
gcloud sql databases create "$DB_NAME" \
  --instance="$DB_INSTANCE" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (이미 존재)"

echo "▶ DB 사용자 생성..."
gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (이미 존재)"

# Cloud SQL 연결 이름
CLOUDSQL_CONN="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"

# DATABASE_URL (Cloud SQL Unix socket 방식)
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${CLOUDSQL_CONN}"

# ── Secret Manager 등록 ───────────────────────────────────────
echo "▶ Secret Manager 등록..."

create_or_update_secret() {
  local name=$1
  local value=$2
  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "$value" | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID"
    echo "  [업데이트] $name"
  else
    echo "$value" | gcloud secrets create "$name" --data-file=- --replication-policy=automatic --project="$PROJECT_ID"
    echo "  [생성] $name"
  fi
}

create_or_update_secret "steel-mes-db-url"         "$DATABASE_URL"
create_or_update_secret "steel-mes-nextauth-secret" "$NEXTAUTH_SECRET"
create_or_update_secret "steel-mes-nextauth-url"    "$NEXTAUTH_URL"

# ── Cloud Build 서비스 계정 권한 ──────────────────────────────
echo "▶ Cloud Build 권한 설정..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

for role in \
  roles/run.admin \
  roles/cloudsql.client \
  roles/secretmanager.secretAccessor \
  roles/artifactregistry.writer \
  roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CB_SA}" \
    --role="$role" --quiet
done

# Cloud Run SA에도 Secret/CloudSQL 권한
CR_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
for role in \
  roles/cloudsql.client \
  roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CR_SA}" \
    --role="$role" --quiet
done

# ── cloudbuild.yaml의 _CLOUDSQL_INST 값 안내 ─────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "✅ GCP 인프라 셋업 완료"
echo ""
echo "📋 cloudbuild.yaml 트리거 설정값:"
echo "   _REGION       = $REGION"
echo "   _SERVICE      = $SERVICE"
echo "   _CLOUDSQL_INST = $CLOUDSQL_CONN"
echo ""
echo "📋 다음 단계:"
echo "  1. GitHub 저장소를 Cloud Build 트리거에 연결"
echo "     https://console.cloud.google.com/cloud-build/triggers"
echo "  2. main 브랜치 push 시 자동 배포됩니다"
echo "  3. 첫 배포 후 NEXTAUTH_URL을 실제 Cloud Run URL로 업데이트:"
echo "     echo 'https://YOUR-URL.run.app' | gcloud secrets versions add steel-mes-nextauth-url --data-file=-"
echo "══════════════════════════════════════════════════════"
