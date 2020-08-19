import subprocess

from flask import Flask, request, Response
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello Spiderbot!'

@app.route('/search', methods = ['POST'])
def search():
    req_data = request.get_json()
    keyword = req_data['keyword']
    url = req_data['url']
    try:
        subprocess.check_output(['rm', 'output.json'])
    except Exception as e:
        print("Ignore")

    try:
        subprocess.check_output(['scrapy', 'runspider', "google-search-spider.py", 
        "-a", "keyword=" + keyword, "-a", "checkUrl=" + url, "-o", "output.json"])
    except Exception as e:
        return "Error occurred!"

    with open("output.json") as items_file:
        result = items_file.read()
        if not result:
            return "[]"
        return result

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)