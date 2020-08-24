import argparse
import subprocess
import json
import time

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
    parser = argparse.ArgumentParser(description="Google spider arguments parser")
    parser.add_argument("--keyword", required=True, help="Keyword to search")
    parser.add_argument("--url", required=True, help="URL to match and find rank")
    parser.add_argument("--maxpage", type=int, default=10, help="Position to return")
    parser.add_argument("--num", type=int, default=100, help="Number of result to return")

    args = parser.parse_args()

    print("OUTPUT: " + str(spider_search(args.keyword, args.url, args.maxpage, args.num)))
