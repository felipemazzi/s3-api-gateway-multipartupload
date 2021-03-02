function startReading(fileInput) {
	console.clear();
	getArrayBufferFrom(fileInput);
}

function getArrayBufferFrom(fileInput) {
	console.log(fileInput);
	
	let reader = new FileReader();
	reader.readAsArrayBuffer(fileInput);
	
	reader.onerror = () => logError;
	reader.onabort = () => log('Read aborted');
	reader.onloadstart = () => log('Read started');
	reader.onload = function(e) { finishReading(e.target.result); };
	
	log(reader.readyState);
}

function logError(e) {
	log('Read failed: ' + e.target.error.name);
}

function log(message) {
	console.log(message);
}

async function finishReading(arrayBuffer) {
	log('Read completed');
	log('wholeFile:' + arrayBuffer.byteLength);
	let sliceSizeInBytes = 10000000;
	let slices = getSlicesFrom(arrayBuffer, sliceSizeInBytes);
	let i = 1;
	let uploadId;
	
	if (slices.length > 1) {
	  uploadId = await getUploadId();
	}
	
	let etags = [];
	
	for (let slice of slices) {
		log('slice ' + i + ': ' + slice.byteLength);
		etags[i-1] = await upload(slice, i, uploadId);
		log('ETag: ' + etags[i-1]);
		i++;
	}
	
	if (slices.length > 1) {
	  completeMultipartUpload(etags, uploadId)
	    .then(response => response.text())
	    .then(data => {
	      log(data);
	    });
	}
}

function getSlicesFrom(arrayBuffer, sliceSizeInBytes) {
	let totalSizeInBytes = arrayBuffer.byteLength;
	let slices = getNumberOfSlices(totalSizeInBytes, sliceSizeInBytes);
	let i = 0;
	let slicesArray = [];
	let begin = 0;
	let end = sliceSizeInBytes;
	
	do {
		slicesArray[i] = arrayBuffer.slice(begin, end);
		begin += sliceSizeInBytes;
		end = (i + 1 == slices ? -1 : end + sliceSizeInBytes);
		i++;
	} while (i < slices);
	
	return slicesArray;
}

function getNumberOfSlices(totalSizeInBytes, sliceSizeInBytes) {
	return Math.ceil(totalSizeInBytes / sliceSizeInBytes);
}

async function getUploadId() {
  let uploadId = "";
  
  let resposta = await initiateMultipartUpload();
  let xml = await resposta.text();
  log(xml);

  let parser = new DOMParser();
  let doc = parser.parseFromString(xml, "application/xml");
  log(doc);

  uploadId = doc.getElementsByTagName("UploadId")[0].childNodes[0].nodeValue;

  log("UploadId: " + uploadId);
  return uploadId;
}

async function initiateMultipartUpload() {
  log("Initiating multipart upload");
  
  let endpoint = getEndpoint().concat("?uploads=true");
  log(endpoint);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors', 
    headers: {
      'x-api-key': getApiKey()
    }
  });
  log(response);
  return response;
}

async function upload(sliceData, sliceNumber, uploadId) {
  let endpoint = getEndpoint();
  if (sliceNumber != undefined && uploadId != undefined) {
    endpoint = endpoint.concat("?partNumber=").concat(sliceNumber).concat("&uploadId=").concat(uploadId);
    log("Uploading part " + sliceNumber);
  } else {
    log("Uploading single part");
  }
  log(endpoint);
  
  const response = await fetch(endpoint, {
    method: 'PUT',
    mode: 'cors', 
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-api-key': getApiKey() 
    },
    body: sliceData
  });
  log('Response part ' + sliceNumber + ': ');
  log(response);
  let headers = await response.headers;
  log('Headers part ' + sliceNumber + ': ');
  for (var pair of headers.entries()) {
    log(pair[0] + ': ' + pair[1]);
  }
  let etag = await headers.get("ETag");
  return etag;
}

function getEndpoint() {
  return document.getElementById("endpoint").value.concat(encodeURIComponent(getFileName()));
}

function getApiKey() {
  return document.getElementById("api-key").value;
}

async function completeMultipartUpload(etags, uploadId) {
  log("Completing multipart upload");
  
  let endpoint = getEndpoint().concat("?uploadId=").concat(uploadId);
  log(endpoint);

  let bodyString = '<CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">';
  let i = 1;

  for (etag of etags) {
    bodyString = bodyString.concat("<Part><ETag>").concat(etag).concat("</ETag><PartNumber>").concat(i).concat("</PartNumber></Part>");
    i++;
  }
  bodyString = bodyString.concat("</CompleteMultipartUpload>");
  log(bodyString);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors', 
    headers: {
      'Content-Type': 'application/xml',
      'x-api-key': getApiKey()
    },
    body: bodyString 
  });
  log(response);
  return response;
}

function getFileName() {
  return document.getElementById("file-input").files[0].name;
}
