import scrapy
from scrapy import signals
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

from scrapy.signalmanager import dispatcher

import argparse
import random
import string

queryString = "https://www.google.co.jp/search?q={keyword}&start={start}&num={num}"

def get_random_string(length):
    letters = string.ascii_lowercase
    result_str = ''.join(random.choice(letters) for i in range(length))
    return result_str

class GoogleSearchSpider(scrapy.Spider):
    name = "GoogleSearch"

    def start_requests(self):
        url = queryString.format(keyword = self.keyword, start = self.start, num = self.num)
        yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        # filename = 'response.html'
        # with open(filename, 'wb') as f:
        #     f.write(response.body)
        i = int(self.start)
        for item in response.xpath('//*[@id="rso"]/div/div/div/a'):
        # for item in response.xpath('//*[@id="main"]/div/div/div/a'):
            link = item.xpath("@href").get()
            if "url?q=" in link:
                link = link.split("/url?q=", 1)[1]
            link = link.split("&")[0]
            # title = item.xpath('span/text()').get()
            # title = item.xpath("h3/div/text()").get()
            # title = item.xpath("h3/text()").get()
            # if link is not None and title is not None:
            if link is not None:
                i += 1
                yield {
                    'rank': i,
                    # 'title': title,
                    'url': link
                }                    

def spider_results(keyword, start, num):
    results = []

    def crawler_results(signal, sender, item, response, spider):
        results.append(item)

    dispatcher.connect(crawler_results, signal=signals.item_passed)

    process = CrawlerProcess(get_project_settings())
    process.crawl(GoogleSearchSpider, keyword = keyword, start = start, num = num)
    process.start()  # the script will block here until the crawling is finished
    return results

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Google spider arguments parser")
    parser.add_argument("--keyword", required=True, help="Keyword to search")
    parser.add_argument("--start", type=int, default=0, help="Position to return")
    parser.add_argument("--num", type=int, default=100, help="Number of result to return")

    args = parser.parse_args()

    print(spider_results(args.keyword, args.start, args.num))
