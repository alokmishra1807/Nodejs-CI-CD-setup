# Wanderlust — Dockerized Node.js & MongoDB Application

This project demonstrates how to containerize a Node.js/Express application with MongoDB and how Docker **containers, images, networks, and volumes** work together.

The project first demonstrates the process manually using Docker CLI commands and then uses **Docker Compose** to automate the entire setup.

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Docker
- Docker Compose

---

# 1. Dockerizing the Node.js Application

The Node.js application is packaged into a Docker image using a `Dockerfile`.

Build the application image:

```bash
docker build -t my-node-app .
```

This creates a Docker image called:

```text
my-node-app
```

The image contains the application code, dependencies, and runtime environment required to run the Node.js application.

---

# 2. Running MongoDB Without a Volume

Before using Docker volumes, MongoDB can be started directly as a container:

```bash
docker run -d --name mongodb mongo:8
```

The MongoDB container stores its data in the container's writable layer.

The Node.js application can then be connected to MongoDB using a Docker network.

However, if the MongoDB container is deleted:

```bash
docker rm -f mongodb
```

the MongoDB data stored inside that container is also deleted.

The MongoDB image is **not** deleted.

```text
MongoDB Image
     │
     ▼
MongoDB Container
     │
     └── Database data
```

Deleting the container removes the data stored in that container, while the image remains available to create another container.

If another MongoDB container is created:

```bash
docker run -d --name mongodb-new mongo:8
```

it starts with a fresh database.

### Important

> Without a persistent volume, deleting the MongoDB container can result in loss of the database data.

---

# 3. Creating a Docker Volume Manually

To persist MongoDB data outside the container, create a named Docker volume:

```bash
docker volume create mongo-data
```

Check the volume:

```bash
docker volume ls
```

Inspect it:

```bash
docker volume inspect mongo-data
```

The volume is managed by Docker and provides persistent storage for MongoDB.

---

# 4. Running MongoDB With the Volume

Now run MongoDB and mount the volume to MongoDB's data directory:

```bash
docker run -d \
  --name mongodb \
  -v mongo-data:/data/db \
  mongo:8
```

### Volume mapping

```text
mongo-data:/data/db
```

means:

```text
Docker named volume
       │
       ▼
  mongo-data
       │
       │ mounted at
       ▼
/data/db inside MongoDB container
```

MongoDB stores its database files in `/data/db`.

The important difference is that the data is now stored in the Docker volume instead of only in the container's writable layer.

---

# 5. Testing Data Persistence

Stop and remove the MongoDB container:

```bash
docker rm -f mongodb
```

The container is deleted, but the volume remains.

Check:

```bash
docker volume ls
```

You should still see:

```text
mongo-data
```

Now create another MongoDB container using the same volume:

```bash
docker run -d \
  --name mongodb \
  -v mongo-data:/data/db \
  mongo:8
```

MongoDB will use the existing data stored in `mongo-data`.

### Key concept

> Deleting the container does not delete the named volume.

Therefore, the database data can be reused by another MongoDB container.

---

# 6. Creating a Docker Network Manually

Create a user-defined Docker network:

```bash
docker network create wanderlust-network
```

Check the available networks:

```bash
docker network ls
```

Inspect the network:

```bash
docker network inspect wanderlust-network
```

---

# 7. Running MongoDB on the Network

Run MongoDB and attach it to the network:

```bash
docker run -d \
  --name mongodb \
  --network wanderlust-network \
  -v mongo-data:/data/db \
  mongo:8
```

Now MongoDB is connected to:

```text
wanderlust-network
```

---

# 8. Running the Node.js Application

Build the application image if it has not already been built:

```bash
docker build -t my-node-app .
```

Run the Node.js application on the same network:

```bash
docker run -d \
  --name my-app \
  --network wanderlust-network \
  -p 8080:8080 \
  -e PORT=8080 \
  -e MONGODB_URI=mongodb://mongodb:27017/Wanderlust \
  my-node-app
```

Both containers are now connected to the same Docker network:

```text
                  wanderlust-network
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
        Node.js App              MongoDB
        my-app                   mongodb
        Port 8080                Port 27017
             │                       │
             │                       │
             └──── MongoDB URI ──────┘
```

The application uses:

```text
mongodb://mongodb:27017/Wanderlust
```

Here:

- `mongodb` → MongoDB service/container hostname
- `27017` → MongoDB's default port
- `Wanderlust` → database name

Because both containers are on the same Docker network, the Node.js container can communicate with MongoDB using `mongodb` as the hostname.

---

# 9. Why `localhost` Is Not Used

Inside the Node.js container:

```text
localhost
```

refers to the **Node.js container itself**, not the MongoDB container.

Therefore, this is incorrect when MongoDB is running in another container:

```text
mongodb://localhost:27017/Wanderlust
```

Instead, use the MongoDB container/service name:

```text
mongodb://mongodb:27017/Wanderlust
```

Docker's internal DNS resolves `mongodb` to the MongoDB container.

---

# 10. Docker Compose

The manual process requires several commands:

```text
docker build
docker volume create
docker network create
docker run MongoDB
docker run Node.js
```

Docker Compose allows this configuration to be described in a single YAML file.

The project includes a `docker-compose.yml` file that automates this process.

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile

    ports:
      - "8080:8080"

    environment:
      PORT: 8080
      MONGODB_URI: mongodb://mongodb:27017/Wanderlust

    depends_on:
      - mongodb

    networks:
      - wanderlust-network

  mongodb:
    image: mongo:8

    volumes:
      - mongo-data:/data/db

    networks:
      - wanderlust-network

volumes:
  mongo-data:

networks:
  wanderlust-network:
```

---

# 11. Starting the Entire Application With Compose

Instead of manually executing all the Docker commands, simply run:

```bash
docker compose up --build
```

Docker Compose automatically:

1. Builds the Node.js application image.
2. Pulls the MongoDB image if required.
3. Creates the Docker network.
4. Creates the named MongoDB volume.
5. Creates the Node.js container.
6. Creates the MongoDB container.
7. Connects both containers to the same network.
8. Mounts the volume to MongoDB.
9. Starts the services.

---

# 12. Useful Docker Compose Commands

### Start the application

```bash
docker compose up
```

### Build and start

```bash
docker compose up --build
```

### Start in detached mode

```bash
docker compose up -d
```

### Check running services

```bash
docker compose ps
```

### View application logs

```bash
docker compose logs app
```

### View MongoDB logs

```bash
docker compose logs mongodb
```

### Stop and remove containers

```bash
docker compose down
```

By default, this removes the Compose containers and network but keeps the named volume.

### Remove containers, network, and volumes

```bash
docker compose down -v
```

**Warning:** `docker compose down -v` removes the named volume and therefore deletes the persisted MongoDB data.

---

# 13. Docker Data Persistence

The difference between the two approaches can be summarized as:

### Without a volume

```text
MongoDB Container
       │
       └── Database Data

docker rm mongodb
       │
       ▼
Container + Data deleted
```

### With a named volume

```text
MongoDB Container
       │
       │ mounts
       ▼
mongo-data volume
       │
       └── Database Data

docker rm mongodb
       │
       ▼
Container deleted
Volume remains
Data remains
```

The volume can then be mounted into a new MongoDB container.

---

# 14. Docker Components Used

### Image

A Docker image is the template used to create containers.

Example:

```text
mongo:8
my-node-app
```

### Container

A running instance of an image.

Example:

```text
mongodb
my-app
```

### Network

Allows containers to communicate with each other.

Example:

```text
wanderlust-network
```

### Volume

Provides persistent storage outside the container's writable layer.

Example:

```text
mongo-data
```

### Mount

Connects a volume to a path inside a container.

Example:

```text
mongo-data:/data/db
```

---

# 15. Final Architecture

With Docker Compose, the application architecture is:

```text
                         Docker Compose
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
           Node.js App                   MongoDB
           app container               mongodb container
                │                           │
                │                           │
                └────── Docker Network ─────┘
                            │
                            │
                            ▼
                       mongo-data
                          Volume
                            │
                            ▼
                         /data/db
```

The application is therefore composed of:

- **Node.js container** → runs the backend
- **MongoDB container** → runs the database
- **Docker network** → enables communication between containers
- **Named volume** → provides persistent MongoDB storage
- **Docker Compose** → automates the complete setup

---

# 16. Access the Application

After starting the containers:

```bash
docker compose up --build
```

The Node.js application can be accessed at:

```text
http://localhost:8080
```

---

## Conclusion

This project demonstrates the progression from manually managing Docker resources to using Docker Compose.

The manual approach helps understand how Docker works internally:

```text
Image
  ↓
Container
  ↓
Network + Volume
```

Docker Compose then allows the same infrastructure to be defined declaratively and started with a single command:

```bash
docker compose up --build
```

This makes multi-container application setup easier, repeatable, and less error-prone.
