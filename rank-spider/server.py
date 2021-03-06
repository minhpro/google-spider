# -*- coding: utf-8 -*-
import subprocess
import json
import time
from datetime import datetime
from threading import Thread
import logging

from flask import Flask, request, Response
from flask import make_response, jsonify
app = Flask(__name__)

MAX_PAGE = 100
NUM = 10
STATE_FILE = "data/state.dat"
DATA_FILE = "data/data.json"
ONE_ANSWER_FILE = "data/item.json"

INIT_STATE = 0
SEARCHING = 1
SLEEPY = 2
DONE = 3

OK = 0
EMPTY_RESULT = 3
INVALID_INPUT = 4
ERROR = 5

DELAY = 2
NEXT_KEYWORD_DELAY = 20
WAIT_TIME = 10
TIMEOUT_SEARCHING = 120

BUSY_MESSAGE = "System is busy. Please try again later after one minute!"

@app.route('/')
def hello_world():
    return 'Hello Spiderbot!'

@app.route('/oldResult')
def get_old_result():
    return get_result(False, True)

@app.route('/result')
def get_all_result():
    return get_result(True, True)

@app.route('/oneResult')
def get_one_result():
    return get_result(True, False)

@app.route('/oldSearch', methods = ['GET'])
def old_search():
    content = ""
    with open(DATA_FILE, "r") as f:
        content = f.read()
        
    if content != "":
        old_items = json.loads(content)['result']
        thread = Thread(target = multi_items_search, args = (old_items, ))
        thread.start()
        return {'code': OK, 'message': "OK"}
    else:
        return {'code': EMPTY_RESULT, 'message': "IGNORE"}


@app.route('/search', methods = ['POST'])
def search():
    state_code = check_state(True)
    if state_code == SEARCHING or state_code == SLEEPY:
        return {'code': state_code, 'message': BUSY_MESSAGE}

    save_state('{} {}'.format(SEARCHING, int(time.time())))

    req_data = request.get_json()
    items = req_data['items']
    if not items or len(items) == 0:
        return {'code': INVALID_INPUT, 'message': "Please provide a list of keywords and urls"}
    thread = Thread(target = multi_items_search, args = (items, ))
    thread.start()

    return {'code': OK, 'message': "We are searching. Please get result after some minutes"}

@app.route('/searchOne', methods = ['POST'])
def search_one():
    state_code = check_state(False)
    if state_code == SEARCHING or state_code == SLEEPY:
        return {'code': state_code, 'message': BUSY_MESSAGE}

    save_state('{} {}'.format(SEARCHING, int(time.time())))

    req_data = request.get_json()
    item = req_data['item']
    if not item:
        return {'code': INVALID_INPUT, 'message': "Please provide a keyword and a url"}
    thread = Thread(target = one_item_search, args = (item, ))
    thread.start()

    return {'code': OK, 'message': "We are searching. Please get result after some minutes"}

def save_search_result(data, is_search_all):
    save_content = {'code': OK, 'result': data}
    if not is_search_all:
        with open(ONE_ANSWER_FILE, 'w', encoding="utf-8") as fp:
            json.dump(save_content, fp, ensure_ascii=False)
        
    items = []
    new_items = data if is_search_all else [data]
    
    try:
        with open(DATA_FILE, "r") as f:
            content = f.read()
            if content and content != "":
                logging.info("CONTENT: " + content)
                old_items = json.loads(content)['result']
                for new_item in new_items:
                    is_exist = False
                    for i, item in enumerate(old_items):
                        if item['index'] == new_item['index']:
                            old_items[i] = new_item
                            is_exist = True
                            break
                    if not is_exist:
                        old_items.append(new_item)
                items = old_items
                logging.info("NEW ITEMS: " + str(items))
            else:
                items.append(new_items)
    except FileNotFoundError:
        items.append(data)
    except Exception as e:
        logging.error("FAILED: " + str(e))

    with open(DATA_FILE, 'w', encoding="utf-8") as fp:
        json.dump({'code': OK, 'result': items}, fp, ensure_ascii=False)          

def save_state(state):
    with open(STATE_FILE, 'w') as fp:
        fp.write(state)

def check_state(is_search_all):
    with open(STATE_FILE, "r") as f:
        try:
            content = f.read();
            values = content.split()
            state = int(values[0])
            now = int(time.time())
            if state == SEARCHING:
                start_time = int(values[1])
                time_out = TIMEOUT_SEARCHING * 10 if is_search_all else TIMEOUT_SEARCHING
                if (now - start_time) < time_out:
                    return SEARCHING

            if state == DONE:
                done_time = int(values[1])
                wait_time = (WAIT_TIME * 10) if is_search_all else WAIT_TIME
                if (now - done_time) < wait_time:
                    return SLEEPY
        except Exception:
            return ERROR
    return OK

def get_result(is_get_new_data, is_search_all):
    if is_get_new_data:
        state_code = check_state(is_search_all)
        if state_code == SEARCHING:
            return {'code': SEARCHING, 'message': "System is busy. Please try again later after one minute!"}

    try:
        file = DATA_FILE if is_search_all else ONE_ANSWER_FILE
        with open(file, "r") as f:
            content = f.read()
            if content and content != "":
                return content
            else:
                return {'code': EMPTY_RESULT, 'message': "There is no result!"}
    except FileNotFoundError:
        return {'code': EMPTY_RESULT, 'message': "Error!"}
    except Exception:
        return {'code': ERROR, 'message': "Error!"}

# Should searching in a thread
def multi_items_search(items):
    result = []
    for item in items:
        index = item['index']
        keyword = item['keyword']
        url = item['url']
        item_result = spider_search(keyword, url, MAX_PAGE, NUM)

        date_time = datetime.now().strftime("%Y-%m-%d, %H:%M:%S")
        if not item_result:
            result.append({'index': index, 'keyword': keyword, 'url': url, 'code': 1, 'message': "Not Found", 'time': date_time})
        else:
            rank = item_result['rank']
            full_url = item_result['url']
            result.append({'index': index, 'keyword': keyword, 'url': url, 'code': 0, 'rank': rank, 'fullUrl': full_url, 'time': date_time})
        time.sleep(NEXT_KEYWORD_DELAY)
        
    save_search_result(result, True)
    save_state('{} {}'.format(DONE, int(time.time())))

# Should searching in a thread
def one_item_search(item):
    index = item['index']
    keyword = item['keyword']
    url = item['url']
    item_result = spider_search(keyword, url, MAX_PAGE, NUM)

    date_time = datetime.now().strftime("%m-%d-%Y, %H:%M:%S")
    result = {}
    if not item_result:
        result = {'index': index, 'keyword': keyword, 'url': url, 'code': 1, 'message': "Not Found", 'time': date_time}
    else:
        rank = item_result['rank']
        full_url = item_result['url']
        result = {'index': index, 'keyword': keyword, 'url': url, 'code': 0, 'rank': rank, 'fullUrl': full_url, 'time': date_time}

    save_search_result(result, False)
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
        if (i > 0 and i % 10 == 0):
            time.sleep(NEXT_KEYWORD_DELAY)
        else:
            time.sleep(DELAY)

if __name__ == '__main__':
    with open(STATE_FILE, "w+") as f:
        f.write(str(INIT_STATE))
    app.run(host="0.0.0.0", debug=True)
