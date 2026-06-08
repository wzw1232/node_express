function apiLogger(nameMap = {}) {
  return (req, res, next) => {
    const start = Date.now();

    const url = req.originalUrl;
    const method = req.method;

    // 接口中文名（类似 swagger summary）
    // const apiName = nameMap[url] || '';

    // 记录入参
    const params = {
      query: req.query,
      body: req.body,
      params: req.params,
    };

    console.log(`\n【请求接口地址】：${method} ${url}`);
    console.log(`\n【请求参数】：`, JSON.stringify(params, null, 2));

    // ====== 关键：拦截 res.json ======
    const oldJson = res.json;

    res.json = function (data) {
      const cost = Date.now() - start;

      console.log(`\n【输出参数】：`, JSON.stringify(data, null, 2));
      console.log(`--> 耗时：${cost}ms`);

      return oldJson.call(this, data);
    };

    next();
  };
}

module.exports = {
  apiLogger,
};
