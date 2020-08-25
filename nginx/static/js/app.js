
const INIT_STATE = 0
const SEARCHING = 1
const SLEEPY = 2
const DONE = 3

const OK = 0
const EMPTY_RESULT = 3
const INVALID_INPUT = 4
const ERROR = 5

const ERROR_MESSAGE = "Something went wrong, please try again!";

function searchRank() {
    var items = []
    for (var index = 1; index <= 5; index++) {
        var keyword = document.getElementById('keyword-' + index).value;
        var url = document.getElementById('url-' + index).value;
        if (keyword && keyword !== "" && url && url !== "")
            items.push({'index': index, 'keyword': keyword, 'url': url})
    }
    
    console.log(items);
    if (items.length == 0) {
        alert("Please fill at least one keyword and one url to search");
        return;
    }
    const parameter = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'items': items})
    };

    fetch('/api/search', parameter)
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log(data);
                var code = data['code'];
                if (code == OK) {
                    alert("Keywords will be search. You can get the answer after some (at most three) minutes!")
                } else if (code == SEARCHING) {
                    alert("System is searching. Please try again after some minutes!");
                } else if (code == SLEEPY) {
                    alert("System is busy. Please try again after one minute!");
                } else {
                    alertError();
                }
            } else {
                alertError();
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alertError();
        });
}

function updateRankAndFullURL(data) {
    var items = data['result']
    items.forEach(element => {
        var index = element['index']
        document.getElementById('keyword-' + index).value = element['keyword'];
        document.getElementById('url-' + index).value = element['url'];
        if (element['code'] == 0) {
            document.getElementById('rank-' + index).value = element['rank'];
            document.getElementById('full-url-' + index).value = element['fullUrl'];
        } else {
            document.getElementById('rank-' + index).value = '';
            document.getElementById('full-url-' + index).value = element['message'];
        }
    });
}

function getResult(ignoreNoAnswer) {
    fetch('/api/result')
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log(data); 
                var code = data['code'];
                if ( code == OK) {
                    updateRankAndFullURL(data);
                } else if (code == EMPTY_RESULT && !ignoreNoAnswer) {
                    alert("There is no answer, please try again!");
                } else if (code == SEARCHING && !ignoreNoAnswer) 
                {
                    alert("Keywords are searching. Please get the answer later!");
                } else if (!ignoreNoAnswer) {
                    alertError();
                }
            } else if (!ignoreNoAnswer) {
                alertError();
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            if (!ignoreNoAnswer)
                alertError();
        });
}

function alertError() {
    alert(ERROR_MESSAGE);
}
