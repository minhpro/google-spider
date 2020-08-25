
## Code 

const INIT_STATE = 0
const SEARCHING = 1
const SLEEPY = 2
const DONE = 3

const OK = 0
const EMPTY_RESULT = 3
const INVALID_INPUT = 4
const ERROR = 5

## API: /search

For each keyword and url, search keyword and return the rank of url

Method: POST
Content-Type: application/json
Body:
{
    "items": [
        {"index": 1, "keyword": "key1", "url": "url1"},
        {"index": 2, "keyword": "key2", "url": "url2"},
        {"index": 3, "keyword": "key3", "url": "url3"},
        {"index": 4, "keyword": "key4", "url": "url4"},
        {"index": 5, "keyword": "key5", "url": "url5"}
    ]
}

Response

{
    "code": 0, 
    "message": "We are searching. Please get result after some minutes"
}


## API: GET /result

Get the most recent searching result

Response with HTTP 200

{
    "code": 0 
    "result": [
        {"index": 1, "keyword": "key1", "url": "url1", "code": 0, "rank": 20, "fullUrl": "https://example1.com"},
        {"index": 2, "keyword": "key2", "url": "url2", "code": 0, "rank": 21, "fullUrl": "https://example2.com"},
        {"index": 3, "keyword": "key3", "url": "url3", "code": 1, "message": "Not Found"},
        {"index": 4, "keyword": "key4", "url": "url4", "code": 2, "message": "Unavailable"},
        {"index": 5, "keyword": "key5", "url": "url5", "code": 3, "message": "Timeout"}
    ]
}