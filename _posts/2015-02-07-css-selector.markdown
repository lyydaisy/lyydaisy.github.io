---
layout: post
title:  "CSS选择器"
date:   2015-02-07 15:18:23 
categories: css
tags: css选择器
---
顾名思义，css选择器是用来选择元素的，通过css选择器，可以选择任何形式任何种类的元素。

##伪类和伪元素
伪类一般以一个冒号开始：
{%highlight css%}
:link
:visited
:hover
:active
:focus
:first-child
:lang()
{%endhighlight%}

css3中增加了很多新的伪类：
{%highlight css%}
:target
:root
:nth-child()
:nth-of-type()
:nth-last-of-type()
:firtst-of-type
:last-of-type
:only-of-type
:only-child
:last-child
:empty
:not()
:enabled
:disabled
:checked
{%endhighlight%}

伪元素以两个冒号开始：
{%highlight css%}
::first-line
::first-letter
::before
::after
{%endhighlight%}
<!-- more -->

##通用选择
星号（＊）称为通用选择器，可以经常在css reset看到这种写法，作用是选择文档中的所有元素并设置样式：
{%highlight css%}
*{margin:0;padding:0;}
{%endhighlight%}

选择所有div的子元素：
{%highlight css%}
div *{border:1px solid black;}
{%endhighlight%}

##ID和类
ID选择器以井号（＃）开头，类选择器以英文句号（.）开头：
{%highlight css%}
＃header{border:1px solid black;}
.navlinks{text-decoration:none;}
{%endhighlight%}

##属性选择
可以通过元素已有的属性选择元素，或者基于元素属性值的某个方面进行选择。
根据特定的href值来选择a：
{%highlight css%}
a[href="http://lyydaisy.github.io"]{text-decoration:none;}
{%endhighlight%}

属性和值之间的关系：
{%highlight css%}
[attribute]/*用于选取带有指定属性的元素。
[attribute=value]/*用于选取带有指定属性和值的元素。
[attribute~=value]/*用于选取属性值中包含指定词汇的元素。
[attribute|=value]/*用于选取带有以指定值开头的属性值的元素，该值必须是整个单词。
[attribute^=value]/*匹配属性值以指定值开头的每个元素。
[attribute$=value]/*匹配属性值以指定值结尾的每个元素。
[attribute*=value]/*匹配属性值中包含指定值的每个元素。
{%endhighlight%}

##后代选择
所有后代选择器，用空格隔开：
{%highlight css%}
div a{text-decoration:none;}/*选中div中所有的a*/
{%endhighlight%}

选择直接子元素，使用右尖括号：
{%highlight css%}
div > a{text-decoration:none;}/*选中div的直接子元素a*/
{%endhighlight%}

##同胞选择
同胞选择器使用“＋”或者“~”：
{%highlight css%}
h1 + p {margin-top:50px;}/*紧邻同胞，选择紧跟在h1后面的p*/
h1 ~ p {margin-top:20px;}/*一般同胞，选择在h1后面的所有的p*/
{%endhighlight%}
