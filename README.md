# Development manual
* Server use aws ec2

## Install conda on ubuntu
* https://docs.anaconda.com/miniconda/
```
mkdir -p ~/miniconda3
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm ~/miniconda3/miniconda.sh
conda --version

```
* After installing, close and reopen your terminal application or refresh it by running the following command:
```
source ~/miniconda3/bin/activate
To initialize conda on all available shells, run the following command:

conda init --all
python --version
```

## Install python 3.9
* conda env list
* conda create --name linda-trades python=3.9
* conda activate linda-trades

## Ubuntu need open  port
* sudo ufw allow 3000/tcp
* sudo ufw allow 5000/tcp

## Framework mutual
* https://docs.ccxt.com/

## Create project 
* pip install python-dotenv
* pip install ccxt、

## Create a online database
* https://console.cloud.google.com/welcome?project=focal-pager-418008
* cteate project “linda-trades”

## Make requirements.txt
* pip freeze > requirements.txt

## To do list
* 实时记录期权市场当前市场价格、BTC、ETH 【DONE】
* 需要编写一个运算函数，找出符合时间条件，价格条件的期权 【DONE】
* 获取期权的保证金
* 自动调整期权的保证金防止爆仓
```
curl 'https://www.okx.com/priapi/v5/account/adjust-margin-balance?instId=ETH-USD-250425-3400-C&posSide=net&type=add&amt=0.07455&t=1738020611044' \
  -H 'accept: application/json' \
  -H 'accept-language: zh-CN,zh;q=0.9' \
  -H 'app-type: web' \
  -H 'authorization: eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJleDExMDE3MzMyNjg1NjczNDlCQjRERDdDNDU3MDUxOUM2MUJrYlgiLCJ1aWQiOiJUL3QvZ25Rd2Q4ZGgvSTJ6TFZ0NjB3PT0iLCJzdGEiOjAsIm1pZCI6IlQvdC9nblF3ZDhkaC9JMnpMVnQ2MHc9PSIsImlhdCI6MTczNzk3OTY0NiwiZXhwIjoxNzM5MTg5MjQ2LCJiaWQiOjAsImRvbSI6Ind3dy5va3guY29tIiwiZWlkIjoxNCwiaXNzIjoib2tjb2luIiwiZGlkIjoiZ2RpVmY1ZDcyb1Zoc0FFRGtZWUNCaWVmbnJhOHJoQ3gzbG5ab2hUTlZSMG8veDJBbENUOHFNd2xSdkwxdmJTbiIsImxpZCI6IlQvdC9nblF3ZDhkaC9JMnpMVnQ2MHc9PSIsInVmYiI6IlBUeUE4VzA5ekZVSkJHSjZZUk5HWXc9PSIsInVwYiI6ImlCcmEyVmhOb2t5UmloeGlKLzN6RXc9PSIsImt5YyI6Miwia3lpIjoic1ZrUEh4ak1Hb2Fhc2o2Z3RXMVB4N2RUcENaS2c1LzZLbjFteGFpclpDbE84cWtiMWJMdGFmMklSVUtrTDd4RTd5ZEYvWU5DR1FXLzV5aTRWQnpUM1E9PSIsImNwayI6ImhCdjNtSEZjb0lETG5TckZ6dEdTTlpMT29aU2s1bUE4SHBQcE9MOFE1TlZsMTYzZU93OFRQY2RNRGNIK0RLdDNDQjg1cmpnZXR2YW83Zk52OEJjMWhTdWNlaXhENVFCNzJrUUh5UFlCZlgyYXFOT25JWEFCWW1oU1RqUG5rVWU0WTFzUmEzT2NlMjBTK1k0Mk5LQlk2bnJFbFJtNHJmWXlNMWZONnN1cVNXQT0iLCJ2ZXIiOjEsImNsdCI6Miwic3ViIjoiQjEwODVBMjg2NDMwRTIwQ0ZFNDJFOThDQ0JDQUYzMDUifQ.vgCySqblBUe0c-CA29p98IQIDm_kC0lKizHVK9O_tZk8JxGgqsVViVNRBB_eUlnDIFJ4QSCc4PiX7mVRL3J5pQ' \
  -H 'cookie: intercom-device-id-ny9cf50h=38b18e35-e565-4f49-b9d8-52ee1660052e; preferLocale=zh_CN; _ym_uid=1691159284905183349; ok_prefer_udColor=0; ok_prefer_udTimeZone=2; intercom-id-ny9cf50h=7a8c85ef-5ca2-48fa-90f1-4353699e514d; amp_d77757=cX8GSCpJlIJKYBEVMDGoWZ.TjdzTnZTamhReFJ0VlBQbytkQ1R0QT09..1hln7pakd.1hln7pakf.2.1.3; devId=cd89b9dc-fd38-4e1c-a9c7-411d84b0f2f3; _ym_d=1722731716; _fbp=fb.1.1722756948409.634577442957617176; ok_login_type=OKX_GLOBAL; _ga_G0EKWWQGTZ=deleted; isLogin=1; _vid_t=HYgPjjveaP66iDzH9rFTyD8qM4MFj9CwJLMh8TngfesA02VQE8NuHzy4vWRDoZcdKzrnNgfg8F6TCl5My94dCA1mbTiJBQ8Bj7j+/00=; locale=zh_CN; ok_site_info==0HNxojI5RXa05WZiwiIMFkQPx0Rfh1SPJiOiUGZvNmIsIyVUJiOi42bpdWZyJye; AMP_MKTG_56bf9d43d5=JTdCJTdE; AMP_MKTG_669cbf122d=JTdCJTdE; first_ref=https%3A%2F%2Fwww.okx.com%2Fzh-hans%2Floan; _tk=undefined; fingerprint_id=cd89b9dc-fd38-4e1c-a9c7-411d84b0f2f3; _gid=GA1.2.1035008623.1737813185; connected=1; AMP_669cbf122d=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJjZDg5YjlkYy1mZDM4LTRlMWMtYTljNy00MTFkODRiMGYyZjMlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjJjZDg5YjlkYy1mZDM4LTRlMWMtYTljNy00MTFkODRiMGYyZjMlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzM3ODEzMjM2MTE0JTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTczNzgxMzMxMTM5NiUyQyUyMmxhc3RFdmVudElkJTIyJTNBNDY0JTJDJTIycGFnZUNvdW50ZXIlMjIlM0EwJTdE; _ym_isad=2; amp_21c676=8_d2tEivENr9aIZme0CF1A.dW5kZWZpbmVk..1iijhopl5.1iijhopl7.i.5.n; token=eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJleDExMDE3MzMyNjg1NjczNDlCQjRERDdDNDU3MDUxOUM2MUJrYlgiLCJ1aWQiOiJUL3QvZ25Rd2Q4ZGgvSTJ6TFZ0NjB3PT0iLCJzdGEiOjAsIm1pZCI6IlQvdC9nblF3ZDhkaC9JMnpMVnQ2MHc9PSIsImlhdCI6MTczNzk3OTY0NiwiZXhwIjoxNzM5MTg5MjQ2LCJiaWQiOjAsImRvbSI6Ind3dy5va3guY29tIiwiZWlkIjoxNCwiaXNzIjoib2tjb2luIiwiZGlkIjoiZ2RpVmY1ZDcyb1Zoc0FFRGtZWUNCaWVmbnJhOHJoQ3gzbG5ab2hUTlZSMG8veDJBbENUOHFNd2xSdkwxdmJTbiIsImxpZCI6IlQvdC9nblF3ZDhkaC9JMnpMVnQ2MHc9PSIsInVmYiI6IlBUeUE4VzA5ekZVSkJHSjZZUk5HWXc9PSIsInVwYiI6ImlCcmEyVmhOb2t5UmloeGlKLzN6RXc9PSIsImt5YyI6Miwia3lpIjoic1ZrUEh4ak1Hb2Fhc2o2Z3RXMVB4N2RUcENaS2c1LzZLbjFteGFpclpDbE84cWtiMWJMdGFmMklSVUtrTDd4RTd5ZEYvWU5DR1FXLzV5aTRWQnpUM1E9PSIsImNwayI6ImhCdjNtSEZjb0lETG5TckZ6dEdTTlpMT29aU2s1bUE4SHBQcE9MOFE1TlZsMTYzZU93OFRQY2RNRGNIK0RLdDNDQjg1cmpnZXR2YW83Zk52OEJjMWhTdWNlaXhENVFCNzJrUUh5UFlCZlgyYXFOT25JWEFCWW1oU1RqUG5rVWU0WTFzUmEzT2NlMjBTK1k0Mk5LQlk2bnJFbFJtNHJmWXlNMWZONnN1cVNXQT0iLCJ2ZXIiOjEsImNsdCI6Miwic3ViIjoiQjEwODVBMjg2NDMwRTIwQ0ZFNDJFOThDQ0JDQUYzMDUifQ.vgCySqblBUe0c-CA29p98IQIDm_kC0lKizHVK9O_tZk8JxGgqsVViVNRBB_eUlnDIFJ4QSCc4PiX7mVRL3J5pQ; intercom-session-ny9cf50h=dVFsS0VxOXF6NUZpcGg2L2xNMnJic3Q2WWdyTTYxQ1paaEI4aTRuZ2dvNTRFSHZGKzJNRllpaHhvcFdMOWZmRWF5SGg4MEJ2ZkRqZ2ExSEw5Tkg0RWxtVjJBY2wwSXA4SlVFRjAyT25WdG89LS16dnhRNmMwS0VQMzBhaHFKVEZDMi9BPT0=--786c3693c8395cfd7d6bec38a13a09e134234e4a; __cf_bm=Cweikwu7TSqpcs1e4s5f6JoQHA3zt5AGQC0XYD.rjKw-1738020418-1.0.1.1-uMsZwZq.gpx7Si.mMD7h3kZgg42wm8wLCh226.xLKIsAS2CSA0CWuD1Oazwf8u6fOSwMuRhUa9YNcKtalQ22hw; ok-exp-time=1738020572968; _ga_G0EKWWQGTZ=GS1.1.1738020447.1558.1.1738020575.58.0.0; _ga=GA1.2.1332031777.1663252574; _gat_UA-35324627-3=1; _monitor_extras={"deviceId":"obhQhsaZyClAWEodeb7j-z","eventId":43131,"sequenceNumber":43131}; AMP_56bf9d43d5=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJjZDg5YjlkYy1mZDM4LTRlMWMtYTljNy00MTFkODRiMGYyZjMlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjJ1bmRlZmluZWQlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzM4MDIwNTc1NTM0JTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTczODAyMDU3NzczNiUyQyUyMmxhc3RFdmVudElkJTIyJTNBMjM3NDglMkMlMjJwYWdlQ291bnRlciUyMiUzQTAlN0Q=; tmx_session_id=ou0yqfjlbge_1738020579470; _ym_visorc=b; ok-ses-id=HOKI65mK8VObYsd5uAxQ64I8hT7rgRcV5G2UdEUNb1KI2AkMi/mkDSSdMTSmv9ffs5Ds0h4rWjKxxq1j9QodE2uMs0JgCJjTgYl586v8rgpG6i9+BNNBGfZsQCNgKUfH; traceId=2131280206003330001; ok_prefer_currency=%7B%22currencyId%22%3A0%2C%22isDefault%22%3A0%2C%22isPremium%22%3Afalse%2C%22isoCode%22%3A%22USD%22%2C%22precision%22%3A2%2C%22symbol%22%3A%22%24%22%2C%22usdToThisRate%22%3A1%2C%22usdToThisRatePremium%22%3A1%2C%22displayName%22%3A%22%E7%BE%8E%E5%85%83%22%7D; okg.currentMedia=lg' \
  -H 'devid: cd89b9dc-fd38-4e1c-a9c7-411d84b0f2f3' \
  -H 'priority: u=1, i' \
  -H 'referer: https://www.okx.com/zh-hans/trade-option-chain/btc-usd' \
  -H 'sec-ch-ua: "Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36' \
  -H 'x-cdn: https://www.okx.com' \
  -H 'x-client-signature: {P1363}2Yq1bSV/a+mUi3w7AlHHDBDK+Zr/K8BCXINd+dS0W8o7QK5/Mt/L3tXIY3Lf6Az5DBWe2IyU/P56joh89e34CQ==' \
  -H 'x-client-signature-version: 1.3' \
  -H 'x-id-group: 2140880205729540002-c-49' \
  -H 'x-locale: zh_CN' \
  -H 'x-request-timestamp: 1738020611046' \
  -H 'x-site-info: =0HNxojI5RXa05WZiwiIMFkQPx0Rfh1SPJiOiUGZvNmIsIyVUJiOi42bpdWZyJye' \
  -H 'x-utc: 8' \
  -H 'x-zkdex-env: 0'
```
```
curl 'https://www.okx.com/priapi/v5/account/position/margin-balance?t=1738020728548' \
  -H 'accept: application/json' \
  -H 'accept-language: zh-CN,zh;q=0.9' \
  -H 'app-type: web' \
  -H 'authorization: eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJleDExMDE3MzMyNjg1NjczNDlCQjRERDdDNDU3MDUxOUM2MUJrYlgiLCJ1aWQiOiJUL3QvZ25Rd2Q4ZGgvSTJ6TFZ0NjB3PT0iLCJzdGEiOjAsIm1pZCI6IlQvdC9nblF3ZDhkaC9JMnpMVnQ2MHc9PSIsImlhdCI6MTczNzk3OTY0NiwiZXhwIjoxNzM5MTg5MjQ2LCJiaWQiOjAsImRvbSI6Ind3dy5va3guY29tIiwiZWlkIjoxNCwiaXNzIjoib2tjb2luIiwiZGlkIjoiZ2RpVmY1ZDcyb1Zoc0FFRGtZWUNCaWVmbnJhOHJoQ3gzbG5ab2hUTlZSMG8veDJBbENUOHFNd2xSdkwxdmJTbiIsImxpZCI6IlQvdC9nblF3ZDhkaC9JMnpMVnQ2MHc9PSIsInVmYiI6IlBUeUE4VzA5ekZVSkJHSjZZUk5HWXc9PSIsInVwYiI6ImlCcmEyVmhOb2t5UmloeGlKLzN6RXc9PSIsImt5YyI6Miwia3lpIjoic1ZrUEh4ak1Hb2Fhc2o2Z3RXMVB4N2RUcENaS2c1LzZLbjFteGFpclpDbE84cWtiMWJMdGFmMklSVUtrTDd4RTd5ZEYvWU5DR1FXLzV5aTRWQnpUM1E9PSIsImNwayI6ImhCdjNtSEZjb0lETG5TckZ6dEdTTlpMT29aU2s1bUE4SHBQcE9MOFE1TlZsMTYzZU93OFRQY2RNRGNIK0RLdDNDQjg1cmpnZXR2YW83Zk52OEJjMWhTdWNlaXhENVFCNzJrUUh5UFlCZlgyYXFOT25JWEFCWW1oU1RqUG5rVWU0WTFzUmEzT2NlMjBTK1k0Mk5LQlk2bnJFbFJtNHJmWXlNMWZONnN1cVNXQT0iLCJ2ZXIiOjEsImNsdCI6Miwic3ViIjoiQjEwODVBMjg2NDMwRTIwQ0ZFNDJFOThDQ0JDQUYzMDUifQ.vgCySqblBUe0c-CA29p98IQIDm_kC0lKizHVK9O_tZk8JxGgqsVViVNRBB_eUlnDIFJ4QSCc4PiX7mVRL3J5pQ' \
  -H 'content-type: application/json' \
  -H 'cookie: intercom-device-id-ny9cf50h=38b18e35-e565-4f49-b9d8-52ee1660052e; preferLocale=zh_CN; _ym_uid=1691159284905183349; ok_prefer_udColor=0; ok_prefer_udTimeZone=2; intercom-id-ny9cf50h=7a8c85ef-5ca2-48fa-90f1-4353699e514d; amp_d77757=cX8GSCpJlIJKYBEVMDGoWZ.TjdzTnZTamhReFJ0VlBQbytkQ1R0QT09..1hln7pakd.1hln7pakf.2.1.3; devId=cd89b9dc-fd38-4e1c-a9c7-411d84b0f2f3; _ym_d=1722731716; _fbp=fb.1.1722756948409.634577442957617176; ok_login_type=OKX_GLOBAL; _ga_G0EKWWQGTZ=deleted; isLogin=1; _vid_t=HYgPjjveaP66iDzH9rFTyD8qM4MFj9CwJLMh8TngfesA02VQE8NuHzy4vWRDoZcdKzrnNgfg8F6TCl5My94dCA1mbTiJBQ8Bj7j+/00=; locale=zh_CN; ok_site_info==0HNxojI5RXa05WZiwiIMFkQPx0Rfh1SPJiOiUGZvNmIsIyVUJiOi42bpdWZyJye; AMP_MKTG_56bf9d43d5=JTdCJTdE; AMP_MKTG_669cbf122d=JTdCJTdE; first_ref=https%3A%2F%2Fwww.okx.com%2Fzh-hans%2Floan; _tk=undefined; fingerprint_id=cd89b9dc-fd38-4e1c-a9c7-411d84b0f2f3; _gid=GA1.2.1035008623.1737813185; connected=1; AMP_669cbf122d=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJjZDg5YjlkYy1mZDM4LTRlMWMtYTljNy00MTFkODRiMGYyZjMlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjJjZDg5YjlkYy1mZDM4LTRlMWMtYTljNy00MTFkODRiMGYyZjMlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzM3ODEzMjM2MTE0JTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTczNzgxMzMxMTM5NiUyQyUyMmxhc3RFdmVudElkJTIyJTNBNDY0JTJDJTIycGFnZUNvdW50ZXIlMjIlM0EwJTdE; _ym_isad=2; amp_21c676=8_d2tEivENr9aIZme0CF1A.dW5kZWZpbmVk..1iijhopl5.1iijhopl7.i.5.n; token=eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJleDExMDE3MzMyNjg1NjczNDlCQjRERDdDNDU3MDUxOUM2MUJrYlgiLCJ1aWQiOiJUL3QvZ25Rd2Q4ZGgvSTJ6TFZ0NjB3PT0iLCJzdGEiOjAsIm1pZCI6IlQvdC9nblF3ZDhkaC9JMnpMVnQ2MHc9PSIsImlhdCI6MTczNzk3OTY0NiwiZXhwIjoxNzM5MTg5MjQ2LCJiaWQiOjAsImRvbSI6Ind3dy5va3guY29tIiwiZWlkIjoxNCwiaXNzIjoib2tjb2luIiwiZGlkIjoiZ2RpVmY1ZDcyb1Zoc0FFRGtZWUNCaWVmbnJhOHJoQ3gzbG5ab2hUTlZSMG8veDJBbENUOHFNd2xSdkwxdmJTbiIsImxpZCI6IlQvdC9nblF3ZDhkaC9JMnpMVnQ2MHc9PSIsInVmYiI6IlBUeUE4VzA5ekZVSkJHSjZZUk5HWXc9PSIsInVwYiI6ImlCcmEyVmhOb2t5UmloeGlKLzN6RXc9PSIsImt5YyI6Miwia3lpIjoic1ZrUEh4ak1Hb2Fhc2o2Z3RXMVB4N2RUcENaS2c1LzZLbjFteGFpclpDbE84cWtiMWJMdGFmMklSVUtrTDd4RTd5ZEYvWU5DR1FXLzV5aTRWQnpUM1E9PSIsImNwayI6ImhCdjNtSEZjb0lETG5TckZ6dEdTTlpMT29aU2s1bUE4SHBQcE9MOFE1TlZsMTYzZU93OFRQY2RNRGNIK0RLdDNDQjg1cmpnZXR2YW83Zk52OEJjMWhTdWNlaXhENVFCNzJrUUh5UFlCZlgyYXFOT25JWEFCWW1oU1RqUG5rVWU0WTFzUmEzT2NlMjBTK1k0Mk5LQlk2bnJFbFJtNHJmWXlNMWZONnN1cVNXQT0iLCJ2ZXIiOjEsImNsdCI6Miwic3ViIjoiQjEwODVBMjg2NDMwRTIwQ0ZFNDJFOThDQ0JDQUYzMDUifQ.vgCySqblBUe0c-CA29p98IQIDm_kC0lKizHVK9O_tZk8JxGgqsVViVNRBB_eUlnDIFJ4QSCc4PiX7mVRL3J5pQ; intercom-session-ny9cf50h=dVFsS0VxOXF6NUZpcGg2L2xNMnJic3Q2WWdyTTYxQ1paaEI4aTRuZ2dvNTRFSHZGKzJNRllpaHhvcFdMOWZmRWF5SGg4MEJ2ZkRqZ2ExSEw5Tkg0RWxtVjJBY2wwSXA4SlVFRjAyT25WdG89LS16dnhRNmMwS0VQMzBhaHFKVEZDMi9BPT0=--786c3693c8395cfd7d6bec38a13a09e134234e4a; __cf_bm=Cweikwu7TSqpcs1e4s5f6JoQHA3zt5AGQC0XYD.rjKw-1738020418-1.0.1.1-uMsZwZq.gpx7Si.mMD7h3kZgg42wm8wLCh226.xLKIsAS2CSA0CWuD1Oazwf8u6fOSwMuRhUa9YNcKtalQ22hw; ok-exp-time=1738020572968; _ga_G0EKWWQGTZ=GS1.1.1738020447.1558.1.1738020575.58.0.0; _ga=GA1.2.1332031777.1663252574; _monitor_extras={"deviceId":"obhQhsaZyClAWEodeb7j-z","eventId":43131,"sequenceNumber":43131}; AMP_56bf9d43d5=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJjZDg5YjlkYy1mZDM4LTRlMWMtYTljNy00MTFkODRiMGYyZjMlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjJ1bmRlZmluZWQlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzM4MDIwNTc1NTM0JTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTczODAyMDU3NzczNiUyQyUyMmxhc3RFdmVudElkJTIyJTNBMjM3NDglMkMlMjJwYWdlQ291bnRlciUyMiUzQTAlN0Q=; tmx_session_id=ou0yqfjlbge_1738020579470; _ym_visorc=b; traceId=2131280206003330001; ok_prefer_currency=%7B%22currencyId%22%3A0%2C%22isDefault%22%3A0%2C%22isPremium%22%3Afalse%2C%22isoCode%22%3A%22USD%22%2C%22precision%22%3A2%2C%22symbol%22%3A%22%24%22%2C%22usdToThisRate%22%3A1%2C%22usdToThisRatePremium%22%3A1%2C%22displayName%22%3A%22%E7%BE%8E%E5%85%83%22%7D; okg.currentMedia=lg; ok-ses-id=qymHIeROcx1uK4r5JruwTysHQtXQ4gchqHavWs8Lc9qx23zrBzdYiSjfPNY0R/gttN7RLEQ1M06HUyFGq5Dr09KJ9AVxuD4wfmVloJUY9jG/XexFBC8NRfEa8qTRIZ88' \
  -H 'devid: cd89b9dc-fd38-4e1c-a9c7-411d84b0f2f3' \
  -H 'origin: https://www.okx.com' \
  -H 'priority: u=1, i' \
  -H 'referer: https://www.okx.com/zh-hans/trade-option-chain/btc-usd' \
  -H 'sec-ch-ua: "Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36' \
  -H 'x-cdn: https://www.okx.com' \
  -H 'x-client-signature: {P1363}/Sgn2QB4XPI6Aa4ZcB0oHpWUXr+3F0DsMkIcxr4nd3vrALLul6zsTa8u2/mmfhTkBDUcoQK5QZTCuahOz4TzWA==' \
  -H 'x-client-signature-version: 1.3' \
  -H 'x-id-group: 2140880205729540002-c-51' \
  -H 'x-locale: zh_CN' \
  -H 'x-request-timestamp: 1738020728555' \
  -H 'x-site-info: =0HNxojI5RXa05WZiwiIMFkQPx0Rfh1SPJiOiUGZvNmIsIyVUJiOi42bpdWZyJye' \
  -H 'x-utc: 8' \
  -H 'x-zkdex-env: 0' \
  --data-raw '{"type":"add","instId":"ETH-USD-250425-3400-C","posSide":"net","amt":"0.0521"}'
```

## 新增一个Web 交互
* pip install jupyterlab
* jupyter lab

## OKEx API 模拟交易
* https://www.okx.com/zh-hans/demo-trading-explorer/v5/zh

## 通过 WebSockets 获取实时数据
* https://www.okx.com/docs-v5/en/#overview-production-trading-services
* The Production Trading URL:
```
REST: https://www.okx.com
Public WebSocket: wss://ws.okx.com:8443/ws/v5/public
Private WebSocket: wss://ws.okx.com:8443/ws/v5/private
Business WebSocket: wss://ws.okx.com:8443/ws/v5/business
```

* Demo Trading Services
```
REST: https://www.okx.com
Public WebSocket: wss://wspap.okx.com:8443/ws/v5/public
Private WebSocket: wss://wspap.okx.com:8443/ws/v5/private
Business WebSocket: wss://wspap.okx.com:8443/ws/v5/business
```

## How to start 
* python app.py 启动API服务
* python websocket.py 启动websocket服务，用于记录订单数据
* cd frontend && yarn start 启动前端服务


## 交易模拟机器
* 如何推断出某个期权合理的标记价格

