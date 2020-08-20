import scrapy
from scrapy import signals
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

from scrapy.signalmanager import dispatcher

baseUrl = "https://www.google.co.jp"
queryString = "/search?q="

class GoogleSearchSpider(scrapy.Spider):
    name = "GoogleSearch"

    def start_requests(self):
        url = baseUrl + queryString + self.keyword + "&num=1000"
        yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        filename = 'response.html'
        with open(filename, 'wb') as f:
            f.write(response.body)
        i = 0
        for item in response.xpath('//*[@id="main"]/div/div/div/a'):
            link = item.xpath("@href").get()
            if "url?q=" in link:
                link = link.split("/url?q=", 1)[1]
            link = link.split("&")[0]
            title = item.xpath("h3/div/text()").get()
            if link is not None and title is not None:
                i += 1
                if self.checkUrl is not None and self.checkUrl in link:
                    yield {
                        'rank': i,
                        'title': title,
                        'url': link
                    }
            
def spider_results():
    results = []

    def crawler_results(signal, sender, item, response, spider):
        results.append(item)

    dispatcher.connect(crawler_results, signal=signals.item_passed)

    process = CrawlerProcess(get_project_settings())
    process.crawl(GoogleSearchSpider, keyword = "nal", checkUrl = "nal.vn")
    process.start()  # the script will block here until the crawling is finished
    return results


if __name__ == '__main__':
    print(spider_results())
