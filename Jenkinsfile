pipeline {
    agent {label "dev"}

    stages {

        stage("Code Clone") {
            steps {
                git url: "https://github.com/alokmishra1807/Nodejs-docker-setup.git",
                    branch: "main"
            }
        }

        stage("Build") {
            steps {
                sh "docker build -t my-app ."
            }
        }

        stage("Push to Docker Hub") {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "dockerHubCreds",
                        usernameVariable: "dockerHubUser",
                        passwordVariable: "dockerHubPass"
                    )
                ]) {
                    sh "docker login -u ${dockerHubUser} -p ${dockerHubPass}"

                    sh "docker tag my-app ${dockerHubUser}/my-app:latest"

                    sh "docker push ${dockerHubUser}/my-app:latest"
                }
            }
        }

        stage("Deploy") {
            steps {
                sh "docker compose up -d"
            }
        }
    }
}
