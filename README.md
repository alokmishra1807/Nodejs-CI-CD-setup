# Docker & Jenkins CI/CD — Node.js + MongoDB

This project demonstrates my hands-on learning of **Docker, Docker Compose, Docker Hub, Jenkins, and GitHub Webhooks** by containerizing a Node.js application with MongoDB and creating a basic CI/CD pipeline.

## 🚀 Architecture

```text
GitHub
   │
   │ Push / Webhook
   ▼
Jenkins
   │
   ├── Clone Repository
   ├── Build Docker Image
   ├── Push Image to Docker Hub
   └── Deploy using Docker Compose
            │
            ├── Node.js Container
            │
            └── MongoDB Container
                    │
                    ▼
               Named Volume
```

---

## 1. Dockerfile — Creating the Application Image

I first containerized the Node.js application using a `Dockerfile`.

The Dockerfile defines the environment required to run the application, including the Node.js base image, application files, dependencies, and startup command.

The image was built using:

```bash
docker build -t my-app .
```

This creates a reusable Docker image named `my-app`.

The basic Docker workflow is:

```text
Dockerfile
    ↓
Docker Image
    ↓
Docker Container
```

---

## 2. Docker Volumes — Persistent MongoDB Data

Initially, MongoDB was run without a volume:

```bash
docker run -d --name mongodb mongo:8
```

Without a persistent volume, MongoDB data is stored in the container's writable layer. If the container is deleted, that data is lost.

To make the database persistent, I created a named volume:

```bash
docker volume create mongo-data
```

Then mounted it into MongoDB:

```bash
docker run -d \
  --name mongodb \
  -v mongo-data:/data/db \
  mongo:8
```

The mapping:

```text
mongo-data:/data/db
```

allows MongoDB to store its data in the Docker-managed volume.

Therefore:

```text
Delete Container → Volume remains → Data remains
```

The volume can be reused by a newly created MongoDB container.

---

## 3. Docker Network — Container Communication

I created a user-defined Docker network:

```bash
docker network create wanderlust-network
```

Both the Node.js and MongoDB containers were connected to this network.

The Node.js application connects to MongoDB using:

```text
mongodb://mongodb:27017/Wanderlust
```

Here, `mongodb` is the MongoDB container/service hostname available through Docker's internal DNS.

This allows:

```text
Node.js Container
       │
       │ Docker Network
       ▼
MongoDB Container
```

---

## 4. Docker Compose — Automating the Setup

After understanding the individual Docker commands, I created a `docker-compose.yml` file.

Compose defines:

* Node.js application
* MongoDB
* Docker network
* MongoDB named volume
* Port mapping
* Environment variables
* Service dependency

Instead of manually creating every resource, the entire application can be started with:

```bash
docker compose up --build
```

Docker Compose automatically creates the required containers, network, and volume according to the configuration.

The application uses the Docker Hub image for deployment rather than rebuilding the application during deployment.

---

## 5. Docker Hub

I configured Jenkins to push the built Docker image to Docker Hub.

The flow is:

```text
Source Code
    ↓
Docker Build
    ↓
Docker Image
    ↓
Docker Hub
```

The image is tagged using the Docker Hub username:

```bash
docker tag my-app <dockerhub-username>/my-app:latest
```

and pushed using:

```bash
docker push <dockerhub-username>/my-app:latest
```

Docker Hub therefore acts as the image registry between the build and deployment stages.

---

# 6. Jenkins CI/CD Pipeline

I created a Jenkins Declarative Pipeline to automate the workflow.

The pipeline contains the following stages:

```text
Code Clone
    ↓
Build
    ↓
Push to Docker Hub
    ↓
Deploy
```

### Code Clone

Jenkins clones the `main` branch of the GitHub repository:

```groovy
git url: "https://github.com/alokmishra1807/Nodejs-docker-setup.git",
    branch: "main"
```

### Build

Jenkins builds the Docker image:

```groovy
docker build -t my-app .
```

### Push to Docker Hub

Docker Hub credentials are stored securely in Jenkins Credentials.

Jenkins uses `withCredentials` to authenticate with Docker Hub, then:

```bash
docker tag my-app <dockerhub-username>/my-app:latest
docker push <dockerhub-username>/my-app:latest
```

### Deploy

The deployment stage uses Docker Compose:

```bash
docker compose pull
docker compose up -d
```

This pulls the latest application image from Docker Hub and starts the application using the Compose configuration.

---

# 7. GitHub Webhook

I also configured a **GitHub Webhook** with Jenkins.

Whenever changes are pushed to the configured GitHub repository:

```text
Developer
    │
    │ git push
    ▼
GitHub
    │
    │ Webhook
    ▼
Jenkins
    │
    ▼
Pipeline
```

Jenkins automatically triggers the pipeline.

This removes the need to manually start the Jenkins job after every code change.

---

# 8. Final CI/CD Workflow

The complete workflow is:

```text
        Developer
            │
            │ git push
            ▼
         GitHub
            │
            │ Webhook
            ▼
         Jenkins
            │
            ├── Clone Code
            │
            ├── Build Docker Image
            │
            ├── Push Image
            │
            ▼
       Docker Hub
            │
            │ Pull Image
            ▼
    Docker Compose
            │
       ┌────┴────┐
       ▼         ▼
    Node.js    MongoDB
    Container  Container
                  │
                  ▼
             mongo-data
                Volume
```

## 📚 Key Learnings

Through this project, I gained hands-on understanding of:

* Dockerfiles and Docker image creation
* Docker containers
* Docker image vs container
* Docker volumes and data persistence
* Docker networks and container-to-container communication
* Docker Compose
* Environment variables in containers
* Docker Hub image registry
* Jenkins Declarative Pipelines
* Jenkins Credentials
* GitHub Webhooks
* CI/CD workflow
* Automated Docker image build, push, and deployment

## 🛠️ Run Locally

With Docker Desktop running:

```bash
docker compose up --build
```

Application:

```text
http://localhost:8080
```

Stop the application:

```bash
docker compose down
```

To remove the Compose-managed volume as well:

```bash
docker compose down -v
```

> **Warning:** Removing the volume deletes the persisted MongoDB data.

---

## 🎯 Project Goal

The main goal of this project was to understand how a containerized application moves from **source code to automated deployment**:

```text
Code → Docker Image → Docker Hub → Jenkins → Docker Compose → Running Application
```
