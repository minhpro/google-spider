
const INIT_STATE = 0
const SEARCHING = 1
const SLEEPY = 2
const DONE = 3

const OK = 0
const EMPTY_RESULT = 3
const INVALID_INPUT = 4
const ERROR = 5

const TIMEOUT_SECONDS = 180
const GET_ANSWER_INTERVAL = 20

const ERROR_MESSAGE = "Đã có lỗi xử ra, xin vui lòng thử lại!";
const SEARCHING_MESSAGE = "Từ khoá đang được tìm kiếm, xin hãy thử lại sau!";
const TIMEOUT_MESSAGE = "Không thể nhận được kết quả, xin vui lòng thử lại!"

// App global state
var waiting = false; // is waiting the answer? cannot submit question while waiting

function setup_waiting_timeout(spinElement) {
    waiting = true;
    spinElement.style.visibility = "visible";
    // waiting in maximum TIMEOUT_SECONDS
    var waiting_timer = setTimeout(() => {
        if (waiting) {
            alert(TIMEOUT_MESSAGE);
            spinElement.style.visibility = "hidden";
            waiting = false;
        }
    }, TIMEOUT_SECONDS * 1000);
    return waiting_timer;
}

function check_waiting() {
    if (waiting) {
        alert(SEARCHING_MESSAGE)
        return true;
    }
    return false;
}

function updateAnswer(waiting_timer, spinElement) {
    setTimeout(() => {
        var code = getResult();
        if (code == SEARCHING && waiting) {
            updateAnswer(waiting_timer, spinElement);
        } else {
            waiting = false;
            spinElement.style.visibility = "hidden";
            clearTimeout(waiting_timer);
            if (code == EMPTY_RESULT) {
                alert("Không lấy được kết quả, xin vui lòng thử lại!")
            }
            if (code == ERROR) {
                alertError();
            }
        }
    }, GET_ANSWER_INTERVAL * 1000)
}

function searchOne(index) {
    var items = [];
    var keyword = document.getElementById('keyword-' + index).value;
    var url = document.getElementById('url-' + index).value;
    if (keyword && keyword !== "" && url && url !== "")
        items.push({'index': index, 'keyword': keyword, 'url': url})

    console.log(items);
    if (items.length == 0) {
        alert("Hãy nhập keyword và url để tìm kiếm!");
        return;
    }
    searchRank(items, document.getElementById("spin-" + index));
}

function searchAll() {
    if (check_waiting())
        return;
    var items = [];
    for (var index = 1; index <= 5; index++) {
        var keyword = document.getElementById('keyword-' + index).value;
        var url = document.getElementById('url-' + index).value;
        if (keyword && keyword !== "" && url && url !== "")
            items.push({'index': index, 'keyword': keyword, 'url': url})
    }

    console.log(items);
    if (items.length == 0) {
        alert("Hãy nhập ít nhất một keyword và một url để tìm kiếm!");
        return;
    }
    searchRank(items, document.getElementById("spin-all"));
}

function searchRank(items, spinElement) {
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
                    alert("Từ khoá đang được tìm kiếm, kết quả sẽ được cập nhật sau ít phút!")
                    var waiting_timer = setup_waiting_timeout(spinElement);
                    updateAnswer(waiting_timer, spinElement);
                } else if (code == SEARCHING) {
                    alert(SEARCHING_MESSAGE);
                } else if (code == SLEEPY) {
                    alert("Hệ thống đang bận, hãy thử lại sau một phút!");
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
        document.getElementById('time-' + index).textContent = element['time'];
        if (element['code'] == 0) {
            document.getElementById('rank-' + index).textContent = element['rank'];
            document.getElementById('fullUrl-' + index).textContent = element['fullUrl'];
        } else {
            document.getElementById('rank-' + index).textContent = '';
            document.getElementById('fullUrl-' + index).textContent = element['message'];
        }
    });
}

function getResult() {
    fetch('/api/result')
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log(data); 
                var code = data['code'];
                if ( code == OK) {
                    updateRankAndFullURL(data);
                }
                return code;
            } else {
                return ERROR;
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            return ERROR;
        });
}

function alertError() {
    alert(ERROR_MESSAGE);
}
