# Deploying IWX BuddySplit on AWS — The Easy Path

> A complete, copy-paste deployment guide written for someone new to AWS.
> Goal: get your real app online, securely, for ~**$15–30 / month**, using the
> same building blocks that real companies use.

---

## 0. The big picture (read this first — 2 minutes)

Your app has 3 pieces:

| Piece        | What it is                          | Where it will live on AWS              |
| ------------ | ----------------------------------- | -------------------------------------- |
| **Frontend** | Next.js website (port 3000)         | One EC2 server (Docker)                |
| **Backend**  | NestJS API + Socket.IO (port 4000)  | Same EC2 server (Docker)               |
| **Database** | PostgreSQL                          | Amazon RDS (a managed Postgres service)|
| **Email**    | SMTP for OTPs, notifications        | Amazon SES (managed email service)     |
| **DNS+HTTPS**| Domain name + SSL certificates      | Route 53 + Caddy (auto Let's Encrypt)  |

**Why this design?**
- **1 EC2 server** running Docker = simplest possible "real" deployment. One box, one SSH session, one `docker compose up`.
- **RDS for the database** = you never want to lose user data because a server died. RDS does backups automatically.
- **SES for email** = your OTP / notification emails actually reach the inbox (gmail will block emails sent from a random EC2 IP).
- **Caddy** = a tiny reverse proxy that gives you free, automatic HTTPS certificates. Zero config.

> **What companies do at scale (Phase 2, for your learning — see bottom of doc):**
> Replace the single EC2 with **ECS Fargate + Application Load Balancer + CloudFront + ECR + GitHub Actions CI/CD**. Same architecture, just horizontally scalable. Start with Phase 1; graduate when traffic demands it.

---

## 1. One-time AWS account setup (~15 minutes)

### 1.1 Create the account
1. Go to <https://aws.amazon.com> → **Create an AWS Account**.
2. Add a credit card (most things below are free-tier eligible for 12 months).
3. Pick the AWS Region closest to your users. Examples:
   - India → `ap-south-1` (Mumbai)
   - Europe → `eu-west-1` (Ireland)
   - US East Coast → `us-east-1` (N. Virginia)
   - **Use the same region for everything below.** Write yours down.

### 1.2 Stop using the root user (very important)
The email you signed up with is the "root" account. Don't use it day-to-day.

1. AWS Console → search **IAM** → **Users** → **Create user**.
2. Name: `you-admin`. Tick "Provide user access to AWS Management Console".
3. Permissions → **Attach policies directly** → check `AdministratorAccess`.
4. Create. Copy the sign-in URL (looks like `https://123456789.signin.aws.amazon.com/console`).
5. Sign out of root → sign in as `you-admin` from now on.
6. Top-right menu → **Security credentials** → **Enable MFA** (use Google Authenticator).

### 1.3 Set a billing alert (so you never get a surprise bill)
1. Console → search **Billing** → **Billing preferences** → enable "Receive Free Tier Alerts" and "Receive Billing Alerts".
2. Search **CloudWatch** → **Alarms** → **Billing** → **Create alarm** → threshold `$10` → email yourself.

---

## 2. Buy a domain & set up DNS (Route 53) — 10 minutes

You need a domain like `buddysplit.app`. You can buy it anywhere (GoDaddy, Namecheap), but using **Route 53** keeps everything in AWS.

1. Console → **Route 53** → **Registered domains** → **Register domain**.
2. Search a name, buy it (~$12/year for `.com`).
3. Route 53 → **Hosted zones** → click your domain → you'll see an empty zone with NS + SOA records. Good — we'll add more later.

Decide your two subdomains now (you'll reuse them everywhere):
- `app.buddysplit.app` → frontend (Next.js)
- `api.buddysplit.app` → backend (NestJS + WebSockets)

> If you bought elsewhere, point the domain's nameservers to Route 53's NS records — Google "transfer DNS to Route 53" for your registrar.

---

## 3. Create the database (Amazon RDS PostgreSQL) — 10 minutes

1. Console → **RDS** → **Create database**.
2. Choose:
   - **Standard create**
   - Engine: **PostgreSQL**, version 16.x
   - Templates: **Free tier**
   - DB instance identifier: `buddysplit-db`
   - Master username: `buddysplit`
   - Master password: click **Auto generate** → **copy it now and save somewhere safe** (e.g. 1Password).
   - Instance class: `db.t4g.micro` (free tier)
   - Storage: `20 GB` gp3, disable autoscaling for now
   - **Connectivity**:
     - VPC: default
     - Public access: **No** (we'll connect from EC2 inside the same VPC — safer)
     - VPC security group: **Create new** → name it `buddysplit-db-sg`
     - AZ: any
   - **Additional configuration**:
     - Initial database name: `buddysplit`
     - Backups: 7 days retention
3. **Create database**. Wait ~10 minutes until status = "Available".
4. Click the DB → **Connectivity & security** → copy the **Endpoint** (looks like `buddysplit-db.xxxxx.ap-south-1.rds.amazonaws.com`). Save it.

> **What you just learned:** RDS = "Postgres without the babysitting". AWS handles backups, patches, and disk growth. You only manage data.

---

## 4. Set up email sending (Amazon SES) — 15 minutes

1. Console → **Amazon SES** → **Get started**.
2. **Verified identities** → **Create identity** → **Domain** → enter `buddysplit.app` → enable **Easy DKIM** → Create.
3. SES shows you 3 CNAME records → click **Publish to Route 53** (or copy them into your zone manually). Wait ~10 min for "Verified".
4. Also create an identity for the exact "From" email (e.g. `Email address` → `no-reply@buddysplit.app`) and verify it.
5. **By default SES is in "sandbox mode"** — you can only send to verified addresses. To send to real users:
   - SES → **Account dashboard** → **Request production access** → fill the form (1 paragraph: "transactional emails — OTPs and notifications for users of my expense-splitting app"). Approval usually within 24h.
6. **SMTP credentials**:
   - SES → **SMTP settings** → **Create SMTP credentials** → name `buddysplit-smtp` → Create.
   - **Download and save** the username + password (shown once).
   - Note the SMTP endpoint, e.g. `email-smtp.ap-south-1.amazonaws.com`, port `587`, STARTTLS.

> These SMTP creds go into your app via the Admin Portal (the app stores email-account config in the DB, per `backend/src/modules/email`), not into the `.env`.

---

## 5. Launch the server (EC2) — 15 minutes

### 5.1 Create the EC2 instance
1. Console → **EC2** → **Launch instance**.
2. Name: `buddysplit-prod`.
3. AMI: **Ubuntu Server 24.04 LTS** (x86_64 or ARM `t4g` if you prefer — both fine).
4. Instance type: **t3.small** (2 GB RAM — enough for both containers + Caddy). `t3.micro` (1 GB) works but is tight.
5. **Key pair**: **Create new key pair** → name `buddysplit-key` → type `RSA`, format `.pem` → **Download** (you'll never get it again). Save to `~/.ssh/buddysplit-key.pem`.
6. **Network settings** → **Edit**:
   - VPC: default
   - Auto-assign public IP: Enable
   - Firewall (security group): **Create new** → name `buddysplit-web-sg`
   - Allow:
     - SSH (22) from **My IP**
     - HTTP (80) from **Anywhere**
     - HTTPS (443) from **Anywhere**
7. Storage: 20 GB gp3.
8. **Launch**.

### 5.2 Give the EC2 a stable public IP (Elastic IP)
Without this, the IP changes every time you stop/start the instance — and your DNS breaks.

1. EC2 → **Elastic IPs** → **Allocate Elastic IP** → Allocate.
2. Select it → **Actions** → **Associate Elastic IP** → choose your instance → Associate.
3. Copy this IP (e.g. `13.232.45.67`). This is your server's permanent address.

### 5.3 Let EC2 talk to RDS
RDS is locked down by default. We need to allow our EC2's security group to connect.

1. RDS → your DB → **Connectivity & security** → click the security group `buddysplit-db-sg`.
2. **Inbound rules** → **Edit** → **Add rule**:
   - Type: PostgreSQL
   - Source: **Custom** → start typing `buddysplit-web-sg` → pick it
3. Save.

> **What you just learned:** AWS uses "Security Groups" as firewalls. You don't open ports to the internet; you reference *which other resources* are allowed. This is the core of cloud network security.

### 5.4 Point your domain at the server
1. Route 53 → your hosted zone → **Create record**.
2. Record 1: name `app`, type `A`, value = your Elastic IP, TTL 300 → Create.
3. Record 2: name `api`, type `A`, value = same Elastic IP, TTL 300 → Create.
4. Wait 2–5 minutes. Test from your laptop:
   ```bash
   nslookup app.buddysplit.app
   nslookup api.buddysplit.app
   ```
   Both should return your Elastic IP.

---

## 6. Deploy the app onto EC2 — 20 minutes

### 6.1 SSH into the server
On your laptop (Mac/Linux/Windows with Git Bash or WSL):
```bash
chmod 400 ~/.ssh/buddysplit-key.pem
ssh -i ~/.ssh/buddysplit-key.pem ubuntu@13.232.45.67   # ← your Elastic IP
```

### 6.2 Install Docker + Docker Compose
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
exit                   # log out so the new group takes effect
```

SSH back in:
```bash
ssh -i ~/.ssh/buddysplit-key.pem ubuntu@13.232.45.67
docker --version       # should print 27.x
docker compose version # should print v2.x
```

### 6.3 Clone your code
```bash
git clone https://github.com/<your-username>/IWX-BuddySplit.git
cd IWX-BuddySplit
```
> Private repo? Either make it public temporarily, or set up a [deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#deploy-keys).

### 6.4 Create your production env files
```bash
cd infra/prod
cp .env.example .env
cp backend.env.example backend.env
cp frontend.env.example frontend.env
```

Generate strong secrets:
```bash
for k in JWT_ACCESS_SECRET JWT_REFRESH_SECRET OTP_HMAC_SECRET ENC_SECRET; do
  echo "$k=$(openssl rand -hex 32)"
done
echo "PASSWORD_PEPPER=$(openssl rand -hex 24)"
echo "REVALIDATION_SECRET=$(openssl rand -hex 24)"
```

Edit each file with `nano`:
```bash
nano backend.env       # paste secrets, set DB_HOST to your RDS endpoint, set real domains
nano frontend.env      # set REVALIDATION_SECRET to the SAME value as backend
nano .env              # set NEXT_PUBLIC_API_URL=https://api.yourdomain.com (and WS_URL)
```

Then edit the Caddyfile to use your real domains:
```bash
nano Caddyfile         # replace app.example.com → app.buddysplit.app, etc.
```

### 6.5 Build & launch
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
First build takes ~5 minutes. Watch logs:
```bash
docker compose -f docker-compose.prod.yml logs -f
```
You should see:
- backend: `🟢 IWX BuddySplit API listening on :4000/api`
- frontend: `▲ Next.js ... Ready`
- caddy: `certificate obtained successfully` for both domains

### 6.6 Test it
Open in browser:
- <https://app.buddysplit.app> — your frontend, with a valid SSL padlock
- <https://api.buddysplit.app/api/v1/health> (or any endpoint your app exposes)

🎉 **You're live.**

---

## 7. Day-2 operations (the things nobody tells beginners)

### Deploy a new version
```bash
ssh -i ~/.ssh/buddysplit-key.pem ubuntu@13.232.45.67
cd ~/IWX-BuddySplit
git pull
cd infra/prod
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker image prune -f       # delete old layers, free disk
```
Migrations run automatically on backend startup (see [backend/Dockerfile](../backend/Dockerfile) `CMD`).

### View logs
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs --tail=200 caddy
```

### Run one-off commands inside the backend container
```bash
docker compose -f docker-compose.prod.yml exec backend sh
# inside:
node ./node_modules/typeorm/cli.js migration:show -d dist/database/data-source.js
```

### Restart just one service
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Connect to the database from your laptop (for debugging)
RDS is private. Tunnel through EC2:
```bash
ssh -i ~/.ssh/buddysplit-key.pem -L 5433:YOUR-RDS-ENDPOINT:5432 ubuntu@13.232.45.67
# in another terminal:
psql "postgresql://buddysplit:PASSWORD@localhost:5433/buddysplit?sslmode=require"
```

### Backups
- **Database**: RDS already takes daily snapshots (7 days). To take a manual one: RDS → your DB → **Actions** → **Take snapshot**.
- **App data**: your code is in Git, secrets are in your `.env` files on the server. Copy those `.env` files to your password manager. That's your full DR plan.

---

## 8. Realistic monthly cost (Mumbai region, USD)

| Resource            | Tier             | Cost           |
| ------------------- | ---------------- | -------------- |
| EC2 `t3.small`      | on-demand        | ~$15           |
| RDS `db.t4g.micro`  | free tier yr 1   | $0 → then ~$12 |
| 20 GB RDS storage   | gp3              | ~$3            |
| Route 53 hosted zone| 1 zone           | $0.50          |
| SES                 | 1k emails / day  | ~$0.10         |
| Domain              | `.com` /year     | ~$12 / 12 = $1 |
| Data transfer out   | <50 GB           | $0–4           |
| **Total**           |                  | **~$20–35/mo** |

After year 1 (free tier ends), expect ~$30–40/mo.

---

## 9. Security checklist (do these before real users hit the site)

- [ ] Root account has MFA, and you never log in as root
- [ ] IAM admin user has MFA
- [ ] SSH security group only allows port 22 from **My IP**, not `0.0.0.0/0`
- [ ] RDS is **not** publicly accessible
- [ ] All `JWT_*`, `OTP_*`, `ENC_SECRET`, `PASSWORD_PEPPER` are 64-hex-char random strings, **different** from each other
- [ ] `CORS_ORIGINS` in `backend.env` is set to your real frontend URL only (not `*`)
- [ ] Database password is auto-generated, never reused, stored in a password manager
- [ ] CloudWatch billing alarm at $10 is active
- [ ] You've taken a manual RDS snapshot and confirmed it appears in the snapshot list

---

## 10. Phase 2 — "how big companies actually deploy" (for your learning)

When your single EC2 starts being a bottleneck (~5k DAU), graduate to this architecture. Every piece below is a 1-for-1 upgrade of the Phase 1 piece — same job, more scalable:

| Phase 1 (now)               | Phase 2 (scale)                                       | Why upgrade                                  |
| --------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| `git pull` on the server    | **GitHub Actions** → push image to ECR → deploy       | Push-button releases, rollbacks, no SSH      |
| One EC2 box                 | **ECS Fargate** (serverless containers)               | Auto-scales, no server to patch              |
| Caddy on EC2                | **Application Load Balancer (ALB)** + ACM cert       | Multi-AZ, health checks, zero-downtime deploy |
| Direct EC2 to user          | **CloudFront** in front of frontend                  | Global CDN, faster page loads                |
| Local Docker build          | **Amazon ECR** (private Docker registry)              | Versioned, scannable images                  |
| Single RDS instance         | RDS **Multi-AZ** + read replicas                      | Survives an entire data-center failure       |
| Secrets in `.env` on server | **AWS Secrets Manager** / SSM Parameter Store         | Rotated, audited, never on disk              |
| Logs via `docker logs`      | **CloudWatch Logs** (already free, just opt in)       | Searchable, alertable, retained              |
| Manual monitoring           | **CloudWatch Alarms** + Sentry for app errors         | Get paged before users complain              |
| Infra clicked in console    | **Terraform** or **AWS CDK**                          | Whole infra as code, reproducible in minutes |

A great learning order once Phase 1 is live:
1. Add a **GitHub Actions** workflow that SSHes to EC2 and runs `git pull && docker compose up -d --build`. (Push-to-deploy, still on Phase 1 infra.)
2. Move the Docker build off the EC2 → build in GitHub Actions, push to **ECR**, EC2 only does `docker compose pull`.
3. Migrate the frontend to **CloudFront + S3** (static export) or to **AWS Amplify Hosting** (managed SSR Next.js).
4. Move the backend from EC2 to **ECS Fargate behind an ALB**. (This is the big jump — but you've already containerized everything, so the Dockerfile doesn't change.)
5. Write the whole thing in **Terraform** so you can rebuild your prod environment in 10 minutes if it ever burns down.

---

## Appendix A — Files this guide created in your repo

| File | Purpose |
| ---- | ------- |
| [backend/Dockerfile](../backend/Dockerfile) | Builds the NestJS API image |
| [backend/.dockerignore](../backend/.dockerignore) | Excludes junk from the build context |
| [frontend/Dockerfile](../frontend/Dockerfile) | Builds the Next.js standalone image |
| [frontend/.dockerignore](../frontend/.dockerignore) | Excludes junk from the build context |
| [frontend/next.config.js](../frontend/next.config.js) | Added `output: 'standalone'` for tiny Docker image |
| [infra/prod/docker-compose.prod.yml](../infra/prod/docker-compose.prod.yml) | Orchestrates backend + frontend + Caddy |
| [infra/prod/Caddyfile](../infra/prod/Caddyfile) | Reverse proxy + automatic HTTPS |
| [infra/prod/backend.env.example](../infra/prod/backend.env.example) | Template for backend prod env |
| [infra/prod/frontend.env.example](../infra/prod/frontend.env.example) | Template for frontend prod env |
| [infra/prod/.env.example](../infra/prod/.env.example) | Build-time public values for Next.js |

## Appendix B — Common errors & fixes

| Symptom | Fix |
| ------- | --- |
| `getaddrinfo ENOTFOUND` for DB | RDS endpoint wrong in `backend.env`, or security group not opened to EC2 SG |
| Backend logs `self signed certificate` for DB | Set `DB_SSL=true` (RDS uses Amazon's CA, the `pg` driver accepts it by default) |
| Caddy can't get cert: `dns problem` | A record not propagated yet — wait 5 min, then `docker compose restart caddy` |
| Caddy `connection refused` | DNS points to wrong IP, or port 80/443 not open in EC2 SG |
| Frontend loads but API calls fail with CORS | `CORS_ORIGINS` in `backend.env` doesn't exactly match `https://app.yourdomain.com` |
| WebSocket disconnects every 60s | Ensure you use the `reverse_proxy` block from this Caddyfile (it sets long timeouts) |
| `out of memory` during `docker build` on t3.micro | Either upgrade to `t3.small`, or build locally and push to ECR (Phase 2 step 2) |
| Emails not arriving | SES still in sandbox → request production access (Step 4.5) |

---

**You did it.** Bookmark this doc. Every command above is the same one you'd run for any Node.js + Postgres app. The skills transfer.
