function searchRank(index) {
    var keyword = document.getElementById('keyword-' + index).value;
    var url = document.getElementById('url-' + index).value;
    if (!keyword || keyword === "" || !url || url === "")
        return;
    console.log("Keyword: " + keyword + " - URL: " + url);
    const parameter = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({keyword: keyword, url: url})
    };

    fetch('/api/search', parameter)
        .then(response => {
            if (response.ok) {
                return response.json()
            }
            if (response.status == 404) {
                updateNotFound(index);
            }
            if (response.status == 419) {
                alert("Keyword is searching! Please try again later");
            }
        })
        .then(data => {
            if (data) {
                console.log(data); 
                updateRankAndFullURL(index, data);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert("Something went wrong, please try again!");
        });
}

function updateRankAndFullURL(index, data) {
    if (data['rank']) {
        document.getElementById('rank-' + index).value = data['rank'];
    }
    if (data['url']) {
        document.getElementById('full-url-' + index).value = data['url'];
    }
}

function updateNotFound(index) {
    document.getElementById('rank-' + index).value = '';
    document.getElementById('full-url-' + index).value = 'Not Found!';
}

function searchKeyword() {
    var keyword = document.getElementById('keyword').value;
    var url = document.getElementById('url').value;
    if (!keyword || keyword === "" || !url || url === "")
        return;
    console.log("Keyword: " + keyword + " - URL: " + url);
    const parameter = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({keyword: keyword, url: url})
    };

    fetch('/api/search', parameter)
        .then(response => response.json())
        .then(data => {
            console.log(data); 
            updateResultTable(data);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert("Something went wrong, please try again!");
        });
}
