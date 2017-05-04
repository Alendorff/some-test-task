# Test task "Jungo" service

## Task description

"Jungo" service should be able to handle POST requests with some resource URL
or with a file. If file provided, it should be at "file" form field. If links provided, "Jungo" should download files from those links firstly and then
send them to "Bulb" service one by one as `multipart/form-data` parameter `file`. 
(That service was provided by third party and can work just with single file).
"Bulb" service responds with some hash-string as plain-text for each file.  
Next, "Jungo" service should calculate for each file the following hash: `sha1(sha1(file) + bulbResponse)`, 
and send response to client with those hashes (for each file).

##### POST request example:

```endpoint
POST localhost:3000/api
```

```json
{
  "page": "https://ya.ru",
  "cat": "http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg",
  "music": "https://cs1-50v4.vk-cdn.net/p8/f00787d59ece64.mp3"
}
```

##### "Jungo" response example:

```json
{
  "page": "1823b91656042f1e5b6fcc90bb23ca8e2735d968",
  "cat": "682279dfec09b5c3d9eb2234b280bb94b6526bc1",
  "music": "b010c4196edd931bef7441441d99052f3a14d732"
}
```

### Additional requirements

* "Jungo" response should have X-RESPONSE-TIME header with total response time in ms
* If any of files is unreachable - "Jungo" should respond with 404 - NotFound.
* If any of files loading longer than 10s - "Jungo" should respond with 504 - GatewayTimeout.
* If "Bulb" service doesn't respond within 5s - "Jungo" should respond with 504 - GatewayTimeout.

## Install

```
git clone https://github.com/Alendorff/some-test-task.git ttask
cd ./ttask
npm i
npm start
```

Server will listen to `localhost:3000`. I put unstyled html page for any GET request to `localhost:3000` 
with form, which will help you to try "Jungo" in action 😉 
or just use postman instead (hint: if sending file, specify property name "file" and do not set any headers).
"Jungo" accepts files at `localhost:3000/api` endpoint.
