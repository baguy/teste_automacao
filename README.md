
# Proxy Name - teste_automacao
### Proxy Base Path - v2/hello-world
Description - Sample maven-archetype-apigee-proxy API Proxy

This API skeleton generator is based on https://github.com/apigee/apigee-config-maven-plugin.

## Prerequisite

1. Maven
2. nodeJS
3. set below environment variable according to your requirement (these are referenced in [Deploy Proxy](#deploy-proxy) section)
   - `APIGEE_ORG` - apigee org name
   - `APIGEE_USERNAME` - apigee edge username
   - `APIGEE_PASSWORD` - apigee edge password
4. Postman (optional, to run tests in postman UI)
5. Newman (optional, as it is anyway installed part of dependencies installed while project creation, install only if it not installed)

## Unit Test
Make sure you have the collection and environment (json files) already under tests folder directory, for advanced use, check pom.xml, execution-id - `integration-tests`

## Deploy - both Environment Configuration and Proxy together

```sh
$ mvn install -Pdefault -Denv.APIGEE_ORG=$APIGEE_ORG -Denv.APIGEE_USERNAME=$APIGEE_USERNAME -Denv.APIGEE_PASSWORD=$APIGEE_PASSWORD -Denv.APIGEE_ENV=test -Dapigee.config.options=update -Dapigee.config.dir=resources/edge
```

## Some notes

- Ensure, all corresponding postman collections file exist with `${env}.Postman_environment.json`, for e.g. `"prod.postman_environment.json"` under `/test` directory if trying to deploy to prod;