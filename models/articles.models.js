const db = require("../db/connection");

exports.selectArticleById = (article_id) => {
  if (!Number.isInteger(parseInt(article_id))) {
    return Promise.reject({ status: 400, msg: "article_id must be a number" });
  }
  return db
    .query("SELECT * FROM articles WHERE article_id = $1", [article_id])
    .then((data) => {
      if (data.rows.length === 0) {
        return Promise.reject({
          status: 404,
          msg: "Not found",
        });
      }
      return data.rows[0];
    });
};

exports.selectArticles = (sort_by = "created_at", order = "DESC") => {
  const sqlQuery = `SELECT articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.votes, articles.article_img_url, count(*) as comment_count FROM articles
LEFT JOIN comments ON comments.article_id = articles.article_id
  GROUP BY articles.article_id
  ORDER BY articles.${sort_by} ${order}`;

  const validOrderByQueries = ["ASC", "DESC"];

  if (!validOrderByQueries.includes(order.toUpperCase())) {
    return Promise.reject({ status: 400, msg: "Invalid order" });
  }

  const validSortByQueries = [
    "author",
    "title",
    "article_id",
    "topic",
    "created_at",
    "votes",
    "article_img_url",
  ];

  if (!validSortByQueries.includes(sort_by)) {
    return Promise.reject({ status: 400, msg: "Invalid sort_by" });
  }

  return db
    .query(sqlQuery)
    .then((response) => {
      return response.rows;
    })
    .catch((err) => Promise.reject(err));
};

exports.selectCommentFromArticleID = (article_id) => {
  return db
    .query(
      "SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC",
      [article_id]
    )
    .then((data) => {
      return data.rows;
    });
};

exports.postCommentOnArticle = (article_id, username, body) => {
  if (username === undefined) {
    return Promise.reject({ status: 400, msg: "username is required" });
  }

  if (body === undefined) {
    return Promise.reject({ status: 400, msg: "body is required" });
  }

  return db
    .query(
      `INSERT INTO comments (body, author, article_id) VALUES ($1, $2, $3) RETURNING *;`,
      [body, username, article_id]
    )
    .then((data) => {
      return data.rows[0];
    });
};

exports.changeArticleVotes = (article_id, votes) => {
  if (votes < 0) {
    return Promise.reject({
      status: 400,
      msg: "An article can not have less than zero votes",
    });
  }

  return db
    .query(
      `UPDATE articles SET votes = $1 WHERE article_id = $2 RETURNING *;`,
      [votes, article_id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.removeComment = (comment_id) => {
  return db
    .query(`DELETE FROM comments WHERE comment_id = $1 RETURNING *;`, 
    [comment_id]).then((res) => {
      if (res.rowCount === 0) {
        return Promise.reject({
          status: 404,
          msg: "Not found",
        });
      }
    });
};