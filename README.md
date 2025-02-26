![Header](banner.png)

For the index page to be able to load local resources without a CORS error, we need to have a web server running. For example:
```
python3 -m http.server [8080]
```
Lastest version available here: https://hugolynch.github.io/buzzwords/

### Rules

In Buzzwords, the goal is to score as many points as possible by creating valid words using a set of 7 provided letters.

![Tiles](rules1.png)

One of these letters is highlighted and must be included in every word you form. The remaining 6 letters are optional and can be used as many times as you’d like, or not at all. Words must be at least 4 letters long.

Words are scored based on their length, with 1 point awarded for each letter, except for 4-letter words, which are only worth 1 point total. Additionally, if you create a word that uses all 7 letters at least once (called a "Buzzword"), you earn an extra 7 bonus points on top of the base score. For example, an 8-letter Buzzword would be worth 8 points plus 7 bonus points, totalling 15 points.

![Score examples](rules2.png)