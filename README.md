# S3 API Gateway Multipart Upload

Prova de conceito de solução para upload de arquivos em bucket S3 via API REST no API Gateway AWS, 
utilizando a feature Multipart Upload para envio de arquivos com tamanho superior a 10MB.

## Contexto

Solução definida para um cenário em que não é possível acessar o bucket S3 diretamente 
devido à restrições de segurança.

O API Gateway AWS tem uma limitação de payload de 10MB.


## Estrutura do repositório

### api

Template com as definições da API proxy do serviço S3 e configurações necessárias para habilitar CORS. 
Pode ser importado no API Gateway AWS para criar a API REST que será consumida pelo frontend.

Substituir:
* `REGION` pelo código da região AWS onde será feito o deploy da API
* `IAM_ROLE_ARN` pelo código ARN da IAM Role que será utilizada pelo API Gateway 
para acessar o serviço S3

### frontend

Frontend JavaScript (client da API) responsável por ler os arquivos e efetuar o upload 
em partes de 10MB.

### iam

Template de IAM Policy com as permissões mínimas necessárias para upload no S3.

Substituir `BUCKET_NAME` pelo nome do bucket S3 onde será realizado o upload.


## Instruções de uso

* Utilizar o [template de IAM Policy](iam/s3-multipart-upload-iam-policy.json) para criar uma 
IAM Role que será utilizada pelo API Gateway para acessar o serviço S3.
* Utilizar o [template com as definições da API](api/s3api-test-swagger-apigateway.yaml) 
para criar e publicar a API proxy do S3.
* Abrir o [frontend](frontend/index.html) em um navegador.
  * Informar o endpoint da API e o nome do bucket S3 no formato. 
https://`API_GATEWAY_URL`/`STAGE_NAME`/`BUCKET_NAME`/
  * Informar headers adicionais que serão enviados nas requisições ao API Gateway, 
por exemplo `x-api-key`.
  * Selecionar o arquivo para upload.


## Referências

* [Tutorial: Create a REST API as an Amazon S3 proxy in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html)
* [Uploading and copying objects using multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
* [FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
* [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
* [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
