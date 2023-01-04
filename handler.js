"use strict";
const AWS = require("aws-sdk");
const TABLE_NAME = process.env.TABLE_NAME;
const dynamoDbClientParams = {};
if (process.env.IS_OFFLINE) {
  dynamoDbClientParams.region = 'localhost'
  dynamoDbClientParams.endpoint = 'http://localhost:8000'
}
const dynamoDbClient = new AWS.DynamoDB.DocumentClient(dynamoDbClientParams);

const html = `<html><head></head><body style="font-size: [[size]]; font-family: [[family]]">[[text]][[COUNT]]</body></html>`;

const getData = async (referer, page) => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      domain: referer,
      pageId: page
    }
  };
  return await dynamoDbClient.get(params).promise();
}

const createData = async(referer, page) => {
  const TTL_DELTA = 60 * 60 * 24 * 120; // Keep records for 120 days
  const query = {
    TableName: TABLE_NAME,
    Item: {
      domain: referer,
      pageId: page,
      pageViews: 1,
      ttl: Math.floor(+new Date() / 1000) + TTL_DELTA
    },
  };
  try {
    await dynamoDbClient.put(query).promise();
  } catch (error) {
    console.error(error);
    return null;
  }
}

const updateData = async(data) => {
  const query = {
    TableName: TABLE_NAME,
    Key: {
      domain: data.domain,
      pageId: data.pageId,
    },
    UpdateExpression: "set pageViews = :v",
    ExpressionAttributeValues: {
      ":v": data.pageViews + 1
    }
  }
  try {
    await dynamoDbClient.update(query).promise();
  } catch (error) {
    console.error(error);
    return null;
  }
}

const res = (pageViews, params) => {
  let finalHTML = html.replace("[[COUNT]]", pageViews)
    .replace("[[family]]", params?.family ? params.family : 'monospace')
    .replace("[[size]]", params?.size ? params.size + 'px' : '60px')
    .replace("[[text]]", params?.text ? params.text : '');
  return {
    statusCode: 200,
    body: finalHTML,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    },
  };
}

const resJson = (data) => {
  return {
    statusCode: 200,
    body: JSON.stringify(data, null, 2)
  };
}

module.exports.main = async (event) => {
  if (process.env.IS_OFFLINE)
    event.headers.referer = "https://localtest.com/"
  if (!event.headers.referer || !event?.pathParameters?.proxy || !/^([a-z\-\_0-9]*)$/.test(event.pathParameters.proxy))
    return res(0, event.queryStringParameters);
  const {Item} = await getData(event.headers.referer, event.pathParameters.proxy);
  if (!Item?.pageViews) {
    await createData(event.headers.referer, event.pathParameters.proxy);
    return res(1, event.queryStringParameters);
  } else {
    await updateData(Item);
    return res(Item.pageViews + 1, event.queryStringParameters);
  }
};
