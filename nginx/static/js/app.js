
const NUMBER_ITEMS = 10

const INIT_STATE = 0
const SEARCHING = 1
const SLEEPY = 2
const DONE = 3

const OK = 0
const EMPTY_RESULT = 3
const INVALID_INPUT = 4
const ERROR = 5

const TIMEOUT_SECONDS = 120
const GET_ANSWER_INTERVAL = 10

const ERROR_MESSAGE = "⚠️ Đã có lỗi xử ra, xin vui lòng thử lại!";
const SEARCHING_MESSAGE = "⚠️ Từ khoá đang được tìm kiếm, xin hãy thử lại sau!";
const TIMEOUT_MESSAGE = "⚠️ Không thể nhận được kết quả, xin vui lòng thử lại!"

const URL_MAX_LENGTH = 30

// App global state
var waiting = false; // is waiting the answer? cannot submit question while waiting
var current_row_count = 0; // Number of rows in the table

function searchOne(index) {
    if (waiting) {
        alert(SEARCHING_MESSAGE)
        return;
    }
    var keyword = document.getElementById('keyword-' + index).value;
    var url = document.getElementById('url-' + index).value;
    if (!keyword || keyword === "" || !url || url === "") {
        alert("Hãy nhập keyword và url để tìm kiếm!");
        return;
    }
    var body = {'item': {'index': index, 'keyword': keyword, 'url': url}};
    var searchInfo = {'index': index, 'url': '/api/searchOne', 'body': body};
    search(searchInfo);
}

function searchAll() {
    if (waiting) {
        alert(SEARCHING_MESSAGE)
        return;
    }
    var items = [];
    for (var index = 1; index <= current_row_count; index++) {
        var checked = document.getElementById('check-' + index).checked;
        if (!checked) {
            continue;
        }
        var keyword = document.getElementById('keyword-' + index).value;
        var url = document.getElementById('url-' + index).value;
        if (keyword && keyword !== "" && url && url !== "")
            items.push({'index': index, 'keyword': keyword, 'url': url})
    }

    console.log(items);
    if (items.length == 0) {
        alert("Hãy chọn ít nhất một keyword và một url để tìm kiếm!");
        return;
    }

    var searchInfo = {'index': 0, 'url': '/api/search', 'body': {'items': items}};
    search(searchInfo);
}

function search(searchInfo) {
    var index = searchInfo['index']; // 0: all, > 0: search for one keyword at index
    var body = searchInfo['body']; // search body
    var url = searchInfo['url'];
    const parameter = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };

    fetch(url, parameter)
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log(data);
                var code = data['code'];
                if (code == OK) {
                    alert("Từ khoá đang được tìm kiếm, kết quả sẽ được cập nhật sau ít phút!")
                    var waiting_timer = setup_waiting_timeout(index);
                    updateAnswer(waiting_timer, index);
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

function get_all_answer() {
    fetch('/api/oldResult')
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log(data); 
                var code = data['code'];
                if ( code == OK) {
                    var items = data['result']
                    current_row_count = items.reduce((acc, item) => item['index'] > acc ? item['index'] : acc, 0);
                    initTableBody(current_row_count);
                    updateRankAndFullURL(data);
                }
            } else {
                initDefaultTableBody();
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            initDefaultTableBody();
        });
}

// index: 0: all, > 0: search for one keyword at index
function setup_waiting_timeout(index) {
    waiting = true;
    var spinElement = document.getElementById("spin-" + index);
    if (index == 0) {
        spinElement = document.getElementById("spin-all");
    }
    spinElement.style.visibility = "visible";
    // waiting in maximum TIMEOUT_SECONDS
    var time_out = index == 0 ? TIMEOUT_SECONDS * NUMBER_ITEMS : TIMEOUT_SECONDS;
    var waiting_timer = setTimeout(() => {
        if (waiting) {
            alert(TIMEOUT_MESSAGE);
            spinElement.style.visibility = "hidden";
            waiting = false;
        }
    }, time_out * 1000);
    return waiting_timer;
}

// index: 0: update all, > 0: update the answer for one keyword at index
function updateAnswer(waiting_timer, index) {
    var spinElement = document.getElementById("spin-" + index);
    var url = '/api/oneResult';

    if (index == 0) {
        spinElement = document.getElementById("spin-all");
        url = '/api/result'
    }

    setTimeout(() => {
        fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log(data); 
                var code = data['code'];
                if ( code == OK) {
                    if (index == 0)
                        updateRankAndFullURL(data);
                    else
                        updateOneRankAndFullURL(index, data);
                }
                if (code == SEARCHING && waiting) {
                    updateAnswer(waiting_timer, index);
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
            } else {
                alertError();
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alertError();
        });
    }, GET_ANSWER_INTERVAL * 1000)
}

function updateRankAndFullURL(data) {
    var items = data['result']
    items.forEach(item => {
        var index = item['index']
        updateOneItem(index, item)
    });
}

function updateOneRankAndFullURL(index, data) {
    var item = data['result']
   updateOneItem(index, item)
}

function updateOneItem(index, item) {
    document.getElementById('keyword-' + index).value = item['keyword'];
    document.getElementById('url-' + index).value = item['url'];
    document.getElementById('time-' + index).textContent = item['time'];
    var urlElemement = document.getElementById('fullUrl-' + index);

    if (item['code'] == 0) {
        document.getElementById('rank-' + index).textContent = item['rank'];
        var link = item['fullUrl'];
        urlElemement.textContent = urlNormalize(link);
        urlElemement.setAttribute('href', link);
    } else {
        document.getElementById('rank-' + index).textContent = '';
        urlElemement.textContent = "Không tìm thấy!";
        urlElemement.setAttribute('href', '');
    }
}

function alertError() {
    alert(ERROR_MESSAGE);
}

function urlNormalize(url) {
    if (url.length > URL_MAX_LENGTH) {
        return url.substring(0, URL_MAX_LENGTH) + "...";
    }
    return url;
}

function toogleAll(select) {
    for (var i = 1; i <= 20; i++) {
        document.getElementById('check-' + i).checked = select;
    }
}

function initTableBody(number) {
    var tbody = $("#data");
    var rowTemplate = `
        <tr>
            <td data-label="Select"><input type="checkbox" id="check-index" name="check" required></td>
            <td data-label="Keyword"><input type="text" id="keyword-index" name="keyword" required></td>
            <td data-label="URL"><input type="text" id="url-index" name="url" required></td>
            <td data-label="Submit"><button onclick="searchOne(index)"><em id="spin-index" class="fa fa-spinner fa-spin"></em>Submit</button></td>
            <td data-label="Rank" id="rank-index"></td>
            <td data-label="FullURL"><a id="fullUrl-index" href=""></a></td>
            <td data-label="Time" id="time-index"></td>
        </tr>`;

    for (var i = 1; i <= number; i++) {
        var row = $.parseHTML(rowTemplate.replace(/index/g, i));
        tbody.append(row);
    }
}

function initDefaultTableBody() {
    current_row_count = NUMBER_ITEMS;
    initTableBody(current_row_count);
}

function appendRow() {
    var tbody = $("#data");
    var tbodyLength = tbody.children().length;
    var rowTemplate = `
        <tr>
            <td data-label="Select"><input type="checkbox" id="check-index" name="check" required></td>
            <td data-label="Keyword"><input type="text" id="keyword-index" name="keyword" required></td>
            <td data-label="URL"><input type="text" id="url-index" name="url" required></td>
            <td data-label="Submit"><button onclick="searchOne(index)"><em id="spin-index" class="fa fa-spinner fa-spin"></em>Submit</button></td>
            <td data-label="Rank" id="rank-index"></td>
            <td data-label="FullURL"><a id="fullUrl-index" href=""></a></td>
            <td data-label="Time" id="time-index"></td>
        </tr>`;

    tbody.append(rowTemplate.replace(/index/g, tbodyLength + 1));
    current_row_count++;
}
