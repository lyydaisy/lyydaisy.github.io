---
layout: post
title:  "python数据抓取"
date:   2015-05-20 12:18:23 
categories: "Python" 
tags: ["python","python数据抓取"]
---
使用python进行数据抓取是一件非常容易的事情，所用到的库主要是urllib2，本文就以抓取淘宝基金数据为例，介绍下简单的python数据抓取。

###准备工作
首先，从淘宝基金的详情页，我们可以拿到了获取数据的ajax链接：
{%highlight python%}
http://licai.taobao.com/json/show_buyer_list.html?bid_page=0&item_id=88888888&seller_id=88888888&page_size=10
{%endhighlight%}
很容易看出来参数的意思，bid_page是第几页，page_size是每页的数据条数，item_id是基金的id，seller_id应该是店家的id。<!-- more -->
需要通过这几个参数才能获取数据，所以我们把感兴趣的几个基金的参数都找出来，并放在数组中，每一组参数放在字典中：
{%highlight python%}
items = [
	{'name':'广发全球医疗保健指数基金','itemId':'36209912556','sellerId':'1650303557'},
	{'name':'国投瑞银美丽中国混合','itemId':'44256014505','sellerId':'2114738792'},
	{'name':'国金通用国鑫发起','itemId':'36526359740','sellerId':'1661494188'},
	{'name':'浦银安盛战略混合基金','itemId':'40685967972','sellerId':'2114738792'},
	{'name':'博时亚洲票息收益债券','itemId':'41175914785','sellerId':'805166742'},
	{'name':'国投瑞银瑞源保本基金','itemId':'42903554191','sellerId':'1676511771'},
]
{%endhighlight%}

###基础知识
接下来要学习要urllib2的一些方法。
####Request:
可以生成一个请求对象，可以通过参数设置请求的url，请求头，在请求头中可以定义User-Agent、Refer、Host、Cookie等等，这样就可以伪造成是浏览器访问的样子：
{%highlight python%}
req = urllib2.Request(url=url,headers=headers)
{%endhighlight%}
####urlopen
有了request对象，我们就可以使用urlopen方法来打开一个socket连接，参数中还可以设置超时时间：
{%highlight python%}
socket = urllib2.urlopen(req,timeout=5)
{%endhighlight%}
####read
这个其实是socket的方法，用它就能读到返回的数据啦，当然用完别忘了把socket关了：
{%highlight python%}
content = socket.read()  
socket.close() 
{%endhighlight%}

###开工干活
有了前面的准备工作，终于可以进入主题了。
####getUrl:
定义一个getUrl的方法，参数就是上面说的几个，便于生成url，因为这个操作还是比较频繁的：
{%highlight python%}
def getUrl(pageIndex,pageSize,itemId,sellerId):
    return 'http://licai.taobao.com/json/show_buyer_list.html?bid_page='+str(pageIndex)+'&item_id='+itemId+'&seller_id='+sellerId+'&page_size='+str(pageSize)
{%endhighlight%}
####getHtml:
这个方法用于使用url，获取html，我们只设置了User-Agent，因为只要有这个就够用了，淘宝也没有对这个接口进行限制：
{%highlight python%}
def getHtml(url):
	headers = {'User-Agent':'Mozilla/5.0 (X11; U; Linux i686)Gecko/20071127 Firefox/2.0.0.11'}  
	req = urllib2.Request(url=url,headers=headers)  
	try:
		socket = urllib2.urlopen(req,timeout = 5) 
	except urllib2.URLError, e:
		raise MyException("There was an error,please try again later.")
	content = socket.read()  
	socket.close() 
	return content
{%endhighlight%}
####getData:
有了html，我们可以从原始数据中筛选出对我们有用的数据，主要是通过正则表达式，匹配出日期、金额、份数信息，如果没有到最后一页，就继续抓取下一页：
{%highlight python%}
def getData(html):
    pattern = re.compile(r'<tr>(.*?)</tr>',re.S)
    trs = pattern.findall(html)
    pattern = re.compile(r'(\d+\.\d{2}).*?(\d{4}-\d{2}-\d{2})',re.S)
    dataList = {}
    result = {'hasNext':True,'dataList':dataList}
    for tr in trs:
        match = re.search('(\d+\.\d{2}).*?(\d{4}-\d{2}-\d{2})',tr)
        if match:
            rmb = match.group(1)
            date = match.group(2)
            if dataList.has_key(date):
                dataList[date]['count']+=1
                dataList[date]['amount']+=float(rmb)
            else:
                dataList[date] = {'count':1,'amount':float(rmb)}
    pattern = re.compile(r'fnc-pg-next-disabled')
    if pattern.match(html):
        result['hasNext'] = False
    return result
{%endhighlight%}
####dictSort:
有了数据，但是顺序是反的，所以要把顺序倒过来：
{%highlight python%}
def dictSort(dict):
    return [(k,dict[k]) for k in reversed(sorted(dict.keys()))]
{%endhighlight%}
####main:
最后就是要把上面的功能都整合在一起，根据感兴趣的基金，分别获取它们这几天的购买情况，并输出，注意一点，获取到的html因为包含中文，所以要对编码进行处理：
{%highlight python%}
def main():
    print 'loading...\n'
    items = [
        {'name':'广发全球医疗保健指数基金','itemId':'36209912556','sellerId':'1650303557'},
        {'name':'国投瑞银美丽中国混合','itemId':'44256014505','sellerId':'2114738792'},
        {'name':'国金通用国鑫发起','itemId':'36526359740','sellerId':'1661494188'},
        {'name':'浦银安盛战略混合基金','itemId':'40685967972','sellerId':'2114738792'},
        {'name':'博时亚洲票息收益债券','itemId':'41175914785','sellerId':'805166742'},
        {'name':'国投瑞银瑞源保本基金','itemId':'42903554191','sellerId':'1676511771'},
    ]
    for item in items:
        print "***"+item['name']+"***"
        pageIndex = 0
        pageSize = 100
        itemId = item['itemId']
        sellerId = item['sellerId']
        hasNext = True
        while hasNext and pageIndex<5:
            pageIndex+=1
            url = getUrl(pageIndex,pageSize,itemId,sellerId)
            html = getHtml(url)
            html = (html.decode('gbk')).encode('utf8')
            data = getData(html)
            if item.has_key('dataList'):
                finalDataList = item['dataList']
                dataList = data['dataList']
                for (k,v) in dataList.items():
                    if finalDataList.has_key(k):
                        finalDataList[k]['count']+=v['count']
                        finalDataList[k]['amount']+=v['amount']
                    else:
                        finalDataList[k] = v
            else:
                item['dataList'] = data['dataList']
            hasNext = data['hasNext']
        for (k,v) in dictSort(item['dataList']):
            print "%s: 人数%d, 总额%.2f, 人均%.2f" % (k,v['count'],v['amount'],v['amount']/v['count'])
        print ""
    print 'complete.'
{%endhighlight%}

###完工
运行程序就可以得到结果了，应该是像下面这个样子的：
{%highlight python%}
***广发全球医疗保健指数基金***
2015-05-20: 人数1, 总额50.00, 人均50.00
2015-05-19: 人数4, 总额6300.00, 人均1575.00
2015-05-18: 人数12, 总额3040.00, 人均253.33
2015-05-17: 人数7, 总额8400.00, 人均1200.00
2015-05-16: 人数6, 总额2100.00, 人均350.00

***国投瑞银美丽中国混合***
2015-05-20: 人数2, 总额21000.00, 人均10500.00
2015-05-19: 人数3, 总额5551.00, 人均1850.33
2015-05-18: 人数4, 总额29000.00, 人均7250.00
2015-05-17: 人数2, 总额6000.00, 人均3000.00
2015-05-16: 人数11, 总额52920.00, 人均4810.91

...
{%endhighlight%}

