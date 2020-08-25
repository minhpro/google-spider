# -*- coding: utf-8 -*-
import subprocess
import json
import time
from threading import Thread

from flask import Flask, request, Response
from flask import make_response, jsonify
app = Flask(__name__)

MAX_PAGE = 10
NUM = 100
STATE_FILE = "state.dat"
DATA_FILE = "data.json"

INIT_STATE = 0
SEARCHING = 1
SLEEPY = 2
DONE = 3

OK = 0
EMPTY_RESULT = 3
INVALID_INPUT = 4
ERROR = 5

DEPLAY = 2
WAIT_TIME = 60
TIMEOUT_SEARCHING = 180

@app.route('/')
def hello_world():
    return 'Hello Spiderbot!'

@app.route('/result')
def get_result():
    state_code = check_state()
    if state_code == SEARCHING:
        return {'code': SEARCHING, 'message': "System is busy. Please try again later after one minute!"}

    try:
        with open(DATA_FILE, "r") as f:
            content = f.read()
            if content and content != "":
                return content
            else:
                return {'code': EMPTY_RESULT, 'message': "There is no result!"}
    except FileNotFoundError:
        return {'code': EMPTY_RESULT, 'message': "Error!"}
    except Exception:
        return {'code': ERROR, 'message': "Error!"}

@app.route('/search', methods = ['POST'])
def search():
    state_code = check_state()
    if state_code == SEARCHING or state_code == SLEEPY:
        return {'code': SEARCHING, 'message': "System is busy. Please try again later after one minute!"}

    save_state('{} {}'.format(SEARCHING, int(time.time())))

    req_data = request.get_json()
    items = req_data['items']
    if not items or len(items) == 0:
        return {'code': INVALID_INPUT, 'message': "Please provide a list of keywords and urls"}
    thread = Thread(target = multi_items_search, args = (items, ))
    thread.start()

    return {'code': OK, 'message': "We are searching. Please get result after some minutes"}

def save_search_result(data):
    with open(DATA_FILE, 'w', encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False)

def save_state(state):
    with open(STATE_FILE, 'w') as fp:
        fp.write(state)

def check_state():
    with open(STATE_FILE, "r") as f:
        try:
            content = f.read();
            values = content.split()
            state = int(values[0])
            now = int(time.time())
            if state == SEARCHING:
                start_time = int(values[1])
                if (now - start_time) < TIMEOUT_SEARCHING:
                    return SEARCHING

            if state == DONE:
                done_time = int(values[1])
                if (now - done_time) < WAIT_TIME:
                    return SLEEPY
        except Exception:
            return ERROR
    return OK

# Should searching in a thread
def multi_items_search(items):
    result = []
    for item in items:
        index = item['index']
        keyword = item['keyword']
        url = item['url']
        item_result = spider_search(keyword, url, MAX_PAGE, NUM)

        if not item_result:
            result.append({'index': index, 'keyword': keyword, 'url': url, 'code': 1, 'message': "Not Found"})
        else:
            rank = item_result['rank']
            full_url = item_result['url']
            result.append({'index': index, 'keyword': keyword, 'url': url, 'code': 0, 'rank': rank, 'fullUrl': full_url})
        time.sleep(DEPLAY)
        
    data = {'code': OK, 'result': result}
    save_search_result(data)
    save_state('{} {}'.format(DONE, int(time.time())))

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
        time.sleep(DEPLAY)

if __name__ == '__main__':
    with open(STATE_FILE, "w+") as f:
        f.write(str(INIT_STATE))
    app.run(host="0.0.0.0", debug=True)
