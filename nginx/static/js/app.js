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

function updateResultTable(data) {
    var resultTable = document.getElementById("result");
    var oldBody = resultTable.children[1];
    var newBody = document.createElement("tbody")
    data.map(item => {
        var row = document.createElement("tr");
        var rankCell = document.createElement("td");
        var titleCell = document.createElement("td");
        var urlCell = document.createElement("td");
        
        rankCell.appendChild(document.createTextNode(item['rank']));
        titleCell.appendChild(document.createTextNode(item['title']));
        var urlLink = document.createElement('a');
        urlLink.href = item['url'];
        urlLink.text = item['url'];
        urlCell.appendChild(urlLink);

        row.appendChild(rankCell);
        row.appendChild(titleCell);
        row.appendChild(urlCell);

        newBody.appendChild(row);
    })

    resultTable.replaceChild(newBody, oldBody);
    if (data.length == 0) {
        alert("There is no result, please try an other!")
    }
}