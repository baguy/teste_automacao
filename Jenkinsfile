pipeline {
    agent any
    environment {
        BUILD_NAME =  sh(script:'''
            export TZ=America/Sao_Paulo;
            BUILD_NAME=$(date +%Y%m%d)
            if [ ! -f date_$BUILD_NAME ]; then
                touch date_$BUILD_NAME ;
                echo "1" > date_$BUILD_NAME ;
                if [ $(ls | grep date_  -i date_$BUILD_NAME -c ) >= 1 ]; then
                    rm --help;
                    rm $(ls | grep date_  -i date_$BUILD_NAME );
                fi;
            else
                echo $[$(cat date_$BUILD_NAME ) + 1] > date_$BUILD_NAME;
            fi;
            echo "$(echo $BUILD_NAME)_$(cat date_$BUILD_NAME)"
        ''',returnStdout:true).trim()
        AUTHOR = sh(script: 'git log -1 --pretty=%cn ${GIT_COMMIT} | sed "s/\\ /_/g"', returnStdout: true).trim()
        BRANCH_NAME = sh(returnStdout: true, script: 'echo $GIT_BRANCH | cut -d "/" -f 2').trim()
        PROFILE = sh(returnStdout: true, script: '''
            BRANCH_NAME=$(echo $GIT_BRANCH | cut -d "/" -f 2)
            case $BRANCH_NAME in
                feature | developer | dev )
                    PROFILE="dev"
                ;;
                master)
                    PROFILE="prd"
                ;;
                release)
                    PROFILE="hml"
            esac;
            echo "${PROFILE}"
            ''').trim()
        PATHSUFFIX = sh(returnStdout: true, script: '''
            BRANCH_NAME=$(echo $GIT_BRANCH | cut -d "/" -f 2)
            case $BRANCH_NAME in
                feature )
                    PATHSUFFIX="-$(git log -1 --pretty=%cn ${GIT_COMMIT}) | sed \"s/\\ /_/g\""
                ;;
                *)
                    PATHSUFFIX=""
                ;;
            esac
            echo "${PATHSUFFIX}"
            ''').trim()
        APIGEE_OPTIONS = sh(returnStdout: true, script: '''
            BRANCH_NAME=$(echo $GIT_BRANCH | cut -d "/" -f 2)
            case $BRANCH_NAME in
                feature | developer | dev )
                    APIGEE_OPTIONS="override"
                ;;
                *)
                    APIGEE_OPTIONS="override"
                ;;
            esac;
            echo "${APIGEE_OPTIONS}"
            ''').trim()
        APIGEE_ORG = 'pefisa'
        UNIT_TEST = sh(returnStdout: true, script: '''
            if [ -d test/unit ]; then
                UNIT_TEST="TRUE"
            else
                UNIT_TEST="FALSE"
            fi;
            echo $UNIT_TEST;
        ''').trim()
        APICKLI = sh(returnStdout: true, script: '''
            if [ -d test/integration/features ]; then
                APICKLI="TRUE"
            else
                APICKLI="FALSE"
            fi
            echo $APICKLI;
        ''').trim()
        POSTMAN = sh(returnStdout: true, script: '''
            if [ -d tests ]; then
                POSTMAN="TRUE"
            else
                POSTMAN="FALSE"
            fi
            echo $POSTMAN;
        ''').trim()
        PROXY_NAME = ''
        TOKEN_APIGEE = credentials('apigee_token')
        TOKEN_SONAR = credentials('sonar_token')
        MAVEN_ACESS = credentials('augusto_credentials')
        FILE_NAME = "${JOB_NAME}.txt"
    }
    stages {
        stage ('Global Stage') {
            stages {
                stage('Process Resources') {
                    agent {
                        docker {
                            reuseNode true
                            image 'maven:3.6.3-openjdk-8'
                        }
                    }
                    environment {
                        PROXY_NAME = sh(returnStdout: true, script: '''echo $( mvn -P $PROFILE clean process-resources  -Dapigee.username=$MAVEN_ACESS_USR -Dapigee.password=$MAVEN_ACESS_PSW | grep "$APIGEE_ORG:" | cut -d " " -f 3 | cut -d ":" -f 2 ) ''').trim()
                    }
                    steps {
                        buildName "$BUILD_NAME"
                        sh 'if [ ! -f  my.properties ] ;  then touch  my.properties ;  fi;'
                        sh 'curl --location --request GET "https://api.enterprise.apigee.com/v1/o/$APIGEE_ORG/apis/$PROXY_NAME/deployments" --header "Authorization: Basic $TOKEN_APIGEE" > ATUAL_VERSION_DEV.json'
                        sh "echo $AUTHOR "
                        sh "echo $PROXY_NAME"
                        sh "echo $JOB_NAME"
                        sh(returnStdout: false, script: '''mvn -P $PROFILE process-resources  -Dapigee.username=$MAVEN_ACESS_USR -Dapigee.password=$MAVEN_ACESS_PSW''')
                        sh "echo $PROXY_NAME > $FILE_NAME"
                    }
                }
                stage('Run Node Tooling') {
                    parallel {                                           
                        stage('Apigeelint') {    
                            agent {
                                docker {
                                    reuseNode true
                                    image 'node:15-alpine'
                                    args '-u root:root'
                                }
                            }                        
                            steps {
                                sh 'npm install -g apigeelint'
                                sh 'npm run-script apigeelint'
                            // em package.json > scrpits > apigeelint .  pode ter teminação no -f "json.js" (the default), "stylish.js", "compact.js", "codeframe.js", "html.js", "table.js", "unix.js", "visualstudio.js", "checkstyle.js", "jslint-xml.js", "junit.js" and "tap.js"
                            }
                        }
                        stage('Jshint') {                            
                            agent {
                                docker {
                                    reuseNode true
                                    image 'node:15-alpine'
                                    args '-u root:root'
                                }
                            } 
                            steps {
                                sh 'npm install -g jshint'
                                sh 'npm run-script jshint'
                            }
                        }
                        stage('JavaScript Unit Test') {                            
                            agent {
                                docker {
                                    reuseNode true
                                    image 'node:15-alpine'
                                    args '-u root:root'
                                }
                            } 
                            when {
                                environment name:'UNIT_TEST', value:'TRUE'
                            }
                            steps {
                                sh 'npm install -g mocha'
                                sh 'npm run-script mocha'
                            }
                        }
                        stage('YAML Validator') {                            
                            agent {
                                docker {
                                    reuseNode true
                                    image 'node:15-alpine'
                                    args '-u root:root'
                                }
                            } 
                            steps {
                                sh 'npm install -g yaml-validator'
                                sh 'npm run-script yaml-test'
                            }
                        }
                    }                
                }    
                stage ('Sonar Analysis') {
                    environment {
                        scannerHome = tool 'SONAR_SCANNER'
                        PROXY_NAME = sh(returnStdout: true, script: '''cat $FILE_NAME''').trim()
                    }
                    steps {
                        withSonarQubeEnv('SONAR_LOCAL') {
                            sh '${scannerHome}/bin/sonar-scanner -e -Dsonar.projectKey=${PROXY_NAME} -Dsonar.host.url=http://168.138.144.170:9000/ -Dsonar.login=$TOKEN_SONAR -Dsonar.sources=. -Dsonar.tests=. -Dsonar.test.inclusions=**/*test*/** -Dsonar.exclusions=**/*test*/**'                            
                        }
                        sleep(5)
                        timeout(time: 1, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }                
                stage('Deploy Production') {
                    environment {
                        PROXY_NAME = sh(returnStdout: true, script: '''cat $FILE_NAME''').trim()
                        FROM=sh(returnStdout: true, script: '''
                            case $PROFILE in
                            prd)
                                FROM="hml"
                            ;;
                            hml)
                                FROM="dev"
                            ;;
                            esac;
                            echo $FROM
                        ''').trim()
                        REVISION = sh(returnStdout: true, script: '''
                            REVISION= curl --location --request GET "https://api.enterprise.apigee.com/v1/o/$APIGEE_ORG/apis/$PROXY_NAME/deployments" --header "Authorization: Basic $TOKEN_APIGEE" | jq '.environment[] | select(.name == "\'$FROM\'") | .revision[0].name ' | sed 's/\"//g';
                            echo $REVISION;
                        ''').trim()
                    }
                    parallel {
                        stage ('Deploy API Proxy - Dependencies') {
                            agent {
                                docker {
                                    reuseNode true
                                    image 'maven:3.6.3-openjdk-8'
                                }
                            }
                            steps {
                                    // sh 'echo -e "Here we deploy the following if required : \n\t \
                                    //     apigee-config:caches\n\t \
                                    //     apigee-config:kvms\n\t \
                                    //     apigee-config:targetservers\n\t \
                                    //     apigee-config:resourcefiles\n\t \
                                    //     apigee-config:flowhooks\n\t \
                                    //     apigee-config:extensions\n\t \
                                    //     apigee-config:specs"'
                                sh(returnStdout: false, script: '''
                                    mvn -P dev clean apigee-config:apiproducts apigee-config:developers apigee-config:apps apigee-config:exportAppKeys -Dapigee.config.option=create -Dapigee.username=$MAVEN_ACESS_USR -Dapigee.password=$MAVEN_ACESS_PSW &&
                                    mvn -P $PROFILE clean process-resources apigee-config:kvms apigee-config:targetservers apigee-config:caches apigee-config:flowhooks apigee-enterprise:configure  -Dapigee.options=update -Dproxy.pathsuffix=$PATHSUFFIX -Dproxy.namesuffix=$PATHSUFFIX -Dapigee.username=$MAVEN_ACESS_USR -Dapigee.password=$MAVEN_ACESS_PSW &&
                                    mvn -P $PROFILE clean process-resources apigee-config:maskconfigs -Dapigee.config.options=update -Dproxy.pathsuffix=$PATHSUFFIX -Dproxy.namesuffix=$PATHSUFFIX -Dapigee.username=$MAVEN_ACESS_USR -Dapigee.password=$MAVEN_ACESS_PSW
                                ''')                                                
                            }
                        }
                        stage('API ') {
                            when {
                                expression {
                                    BRANCH_NAME ==~ /(master|release)/
                                }
                                anyOf {
                                    environment name:'PROFILE', value: 'hml'
                                    environment name:'PROFILE', value: 'prd'
                                }
                            }
                            steps {
                                sh 'curl --location --request POST "https://api.enterprise.apigee.com/v1/o/$APIGEE_ORG/environments/$PROFILE/apis/$PROXY_NAME/revisions/$REVISION/deployments?override=true&delay=0" \
                                    --header "Authorization: Basic $TOKEN_APIGEE"'
                            }
                        }
                        stage('Maven') {
                            agent {
                                docker {
                                    reuseNode true
                                    image 'maven:3.6.3-openjdk-8'
                                }
                            }
                            when {
                                environment name:'PROFILE', value:'dev'
                            }
                            steps {
                                sh(returnStdout: false, script: '''
                                    mvn -P $PROFILE apigee-enterprise:deploy  -Dapigee.options=$APIGEE_OPTIONS -Dapigee.config.options=$APIGEE_OPTIONS -Dproxy.pathsuffix=$PATHSUFFIX -Dproxy.namesuffix=$PATHSUFFIX -Dapigee.username=$MAVEN_ACESS_USR -Dapigee.password=$MAVEN_ACESS_PSW > LAST_DEPLOY.txt ;
                                    LAST_DEPLOY=$(cat LAST_DEPLOY.txt | grep  'Deployed revision is' | cut -d ':' -f 2) ;
                                    echo $LAST_DEPLOY > LAST_DEPLOY.txt;
                                ''')
                            }
                        }
                    }
                }
                stage('Integration Testing') {
                    environment {
                        ENV = sh(returnStdout:true, script:'''
                            ENV=""
                            if [ -f target/tests/*.postman_environment.json ];
                                then
                                    ENV="--environment target/tests/*.postman_environment.json";
                            fi;
                            echo '$ENV';
                            ''')
                        DATAS = sh(returnStdout:true, script:'''
                            DATAS=""
                            if [ -f target/tests/*.postman_scenario.json ];
                                then
                                    DATAS="-d target/tests/*.postman_scenario.json";
                            else
                                if [ -f target/tests/*.postman_scenario.csv ];
                                    then
                                        DATAS="-d target/tests/*.postman_scenario.csv"
                                fi;
                            fi;
                            echo $DATAS;
                            ''')
                        PROXY_NAME = sh(returnStdout: true, script: '''cat $FILE_NAME''').trim()
                        REVISION_ATUAL = sh(returnStdout:true, script:'''
                            REVISION_ATUAL=$(cat ATUAL_VERSION_DEV.json | jq \'.environment[] | select(.name == "\'$PROFILE\'") | .revision[0].name \' | sed \'s/\"//g\') ;
                            rm ATUAL_VERSION_DEV.json;
                            echo $REVISION_ATUAL;
                            ''').trim()
                        REVISION_NEW=sh(returnStdout:true, script:'''
                            PROXY_NAME=$(cat $FILE_NAME);
                            if [ $PROFILE =  'dev' ] ;
                                then
                                    LAST_DEPLOY=$(cat LAST_DEPLOY.txt);
                            else
                                case $PROFILE in
                                    prd)
                                        FROM="hml";;
                                    hml)
                                        FROM="dev";;
                                esac;
                                LAST_DEPLOY=$(curl --location --request GET "https://api.enterprise.apigee.com/v1/o/$APIGEE_ORG/apis/$PROXY_NAME/deployments" --header "Authorization: Basic $TOKEN_APIGEE" | jq '.environment[] | select(.name == "\'$FROM\'") | .revision[0].name ' | sed 's/\"//g');
                            fi;
                            echo $LAST_DEPLOY''').trim()
                    }
                    parallel {
                        stage('Apickli') {
                            agent {
                                docker {
                                    reuseNode true
                                    image 'node:15-alpine'
                                    args '-u root:root'
                                }
                            }
                            when {
                                // environment name:'PROFILE', value:'dev'
                                environment name:'APICKLI', value:'TRUE'
                            }
                            steps {
                                // sh "echo TRUE > Integration.txt"
                                sh 'npm install -g apickli'
                                sh 'npm run-script apickli'
                            }
                        }
                        stage('Newman / Postman') {
                            agent {
                                docker {
                                    reuseNode true
                                    image 'node:15-alpine'
                                    args '-u root:root'
                                }
                            }
                            when {
                                // environment name:'PROFILE', value:'dev'
                                environment name:'POSTMAN', value:'TRUE'
                            }
                            steps {
                                // sh "echo TRUE > Integration.txt"
                                sh 'npm install -g newman'
                                sh 'npm run newman'
                            }
                        }
                    }
                    post {
                        failure {
                            sh(script:'''
                            if [ $REVISION_NEW != 1  ];
                                then
                                    curl --location --request POST "https://api.enterprise.apigee.com/v1/o/$APIGEE_ORG/environments/$PROFILE/apis/$PROXY_NAME/revisions/$REVISION_ATUAL/deployments?override=true&delay=0" \
                                    --header "Authorization: Basic $TOKEN_APIGEE";
                            fi;
                            curl --location --request DELETE "https://api.enterprise.apigee.com/v1/o/$APIGEE_ORG/environments/$PROFILE/apis/$PROXY_NAME/revisions/$REVISION_NEW/deployments" --header "Authorization: Basic $TOKEN_APIGEE";
                            if [ $PROFILE = 'dev'  ];
                                then
                                    curl --location --request DELETE "https://api.enterprise.apigee.com/v1/o/$APIGEE_ORG/apis/$PROXY_NAME/revisions/$REVISION_NEW" --header "Authorization: Basic $TOKEN_APIGEE";
                            fi
                                ''')
                        }
                    }
                }
                stage('OWASP ZAP Security') {
                    agent {
                        docker {
                            reuseNode true
                            image 'owasp/zap2docker-stable'
                            args '-u root:sudo -v ${WORKSPACE}:/zap/wrk:rw'                           
                        }
                    }
                    environment {
                                ENDPOINT=sh(returnStdout: true, script: '''
                                    PROXY_NAME=$(cat $FILE_NAME);
                                    echo "$PROXY_NAME$PATHSUFFIX"

                                    ''').trim()
                    // PROXY_NAME=sh(returnStdout: true, script: '''cat $FILE_NAME''').trim()
                    }
                    steps {
                        sh "zap-full-scan.py -t https://${APIGEE_ORG}-${PROFILE}.apigee.net/${ENDPOINT} -I -J -l PASS"
                    }
                    // post{
                    //     always{
                    //         // publish html
                    //         publishHTML target: [
                    //             allowMissing: false,
                    //             alwaysLinkToLastBuild: false,
                    //             keepAll: true,
                    //             reportDir: '/zap/wrk',
                    //             reportFiles: 'index.html',
                    //             reportName: 'OWASP Zed Attack Proxy'
                    //             ]
                    //     }
                    // }
                }
            }
        }
    }
    post {
        always {
            sh(script:'''
                if [ -f  $FILE_NAME ] ;
                    then
                        rm $FILE_NAME ;
                fi;''')
            script {
                def mailRecipients = 'apigee@2rpnet.com'
                emailext body: '''${SCRIPT, template="2rpnet_template.template"}''',
                mimeType: 'text/html',
                subject: "[Jenkins] Pipeline ${JOB_NAME} - ${BUILD_NUMBER} : ${currentBuild.result}! ",
                to: "${mailRecipients}",
                from: 'apigee@2rpnet.com.br',
                replyTo: "${mailRecipients}",
                recipientProviders: [[$class: 'CulpritsRecipientProvider']]
            }
        }
        failure {
            expression {
                BRANCH_NAME ==~ /(master|release)/
            }
            script {
                def mailRecipients = 'support@2rpnet.com'
                emailext body: '''${SCRIPT, template="2rpnet_template.template"}''',
                mimeType: 'text/html',
                subject: "APIGEE - [Jenkins] Pipeline ${JOB_NAME} - ${BUILD_NUMBER} : ${currentBuild.result}! ",
                to: "${mailRecipients}",
                from: 'apigee@2rpnet.com.br',
                replyTo: "${mailRecipients}",
                recipientProviders: [[$class: 'CulpritsRecipientProvider']]
            }
        }
    }
}
