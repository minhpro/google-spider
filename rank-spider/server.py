import subprocess
import json
import time

from flask import Flask, request, Response
from flask import make_response, jsonify
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello Spiderbot!'

@app.route('/search', methods = ['POST'])
def search():
    MAX_PAGE = 10
    NUM = 100
    req_data = request.get_json()
    keyword = req_data['keyword']
    url = req_data['url']
    result = spider_search(keyword, url, MAX_PAGE, NUM)
    if not result:
        return make_response(jsonify("Not found"), 404)
    return result

def spider_search(keyword, url, maxpage, num):
    for i in range(maxpage):
        try:
            subprocess.check_output(['rm', 'output.json'])
        except Exception as e:
            print("Ignore")

        try:
            subprocess.check_output(['scrapy', 'crawl', "GoogleSearch", 
            "-a", "keyword=" + keyword, 
            "-a", "start=" + str(i * num),
            "-a", "num=" + str(num),
            "-o", "output.json"])
        except Exception as e:
            print("Error occurred!" + str(e))
            return None
        
        with open("output.json") as f:
            try:
                items = json.load(f)
                if items:
                    item = next((x for x in items if url in x['url']), None)
                    if item: 
                        return item
                else:
                    return None
            except Exception:
                return None
        time.sleep(0.2)

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)
