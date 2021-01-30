const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const port = process.env.PORT || 4000;

let operatorObj = {
  eq: "===",
  neq: "!==",
  gt: ">",
  gte: ">=",
};

const responseMessage = (
  message,
  status,
  field,
  field_value,
  condition,
  condition_value
) => {
  let data = null;
  if (field && field_value && condition && condition_value) {
    data = {
      error: status !== "success",
      field,
      field_value,
      condition_value,
      condition,
    };
  }
  return {
    message,
    status,
    data,
  };
};

app.get("/", (req, res) => {
  res.status(200).json({
    message: "My Rule-Validation API",
    status: "success",
    data: {
      name: "Popoola Habib",
      github: "@habibkayode123",
      email: "habibkayodenew@gmail.com",
      mobile: "08118222334",
      twitter: "@Habib_Kayode",
    },
  });
});

app.post("/validate-rule", (req, res) => {
  if (req.body.hasOwnProperty("rule") === false) {
    return res.status(400).json({
      message: "rule is required.",
      status: "error",
      data: null,
    });
  }
  if (req.body.rule.constructor.name !== "Object") {
    return res.status(400).json({
      message: "rule should be an object.",
      status: "error",
      data: null,
    });
  }
  let ruleBody = req.body.rule;

  if (ruleBody.hasOwnProperty("field") === false) {
    return res.status(400).json({
      message: "field property in rule is required.",
      status: "error",
      data: null,
    });
  }
  if (ruleBody.hasOwnProperty("condition") === false) {
    return res.status(400).json({
      message: "condition property in rule is required.",
      status: "error",
      data: null,
    });
  }
  if (ruleBody.hasOwnProperty("condition_value") === false) {
    return res.status(400).json({
      message: "condition_value property in rule is required.",
      status: "error",
      data: null,
    });
  }

  if (req.body.hasOwnProperty("data") === false) {
    return res.status(400).json({
      message: "data is required.",
      status: "error",
      data: null,
    });
  }
  let dataBody = req.body.data;
  let dataType = req.body.data.constructor.name;
  let ruleField = req.body.rule.field;
  let ruleCondition = req.body.rule.condition;
  let ruleConditionValue = req.body.rule.condition_value;
  let responseObject;
  let tryField;
  if (dataType === "Object" || dataType === "String" || dataType === "Array") {
    if (operatorObj.hasOwnProperty(ruleCondition)) {
      try {
        if (dataType === "String" || dataType === "Array") {
          let numField = parseInt(ruleField);

          console.log(numField, "p--p");
          if (numField === 0 || numField) {
            tryField = dataBody[numField];
            console.log(tryField, "pp");
            if (!tryField) {
              throw "Missing value";
            }
          } else {
            responseObject = responseMessage("Invalid field passed.", "error");
            return res.status(400).json(responseObject);
          }
        } else {
          let parts = ruleField.split(".");
          let partLength = parts.length;
          tryField = req.body.data;
          for (let i = 0; i < partLength; i++) {
            if (tryField.hasOwnProperty(parts[i])) {
              tryField = tryField[parts[i]];
            } else {
              responseObject = responseMessage(
                `field ${ruleField} is missing from data.`,
                "error"
              );
              return res.status(400).json(responseObject);
            }
          }
        }
      } catch (err) {
        responseObject = responseMessage(
          `field ${req.body.rule.field} is missing from data.`,
          "error"
        );
        return res.status(400).json(responseObject);
      }

      let evalResult;
      eval(
        `evalResult = tryField ${operatorObj[ruleCondition]} ruleConditionValue `
      );

      if (evalResult) {
        responseObject = responseMessage(
          `field ${req.body.rule.field} successfully validated.`,
          "success",
          req.body.rule.field,
          tryField,
          ruleCondition,
          ruleConditionValue
        );
        return res.status(200).json(responseObject);
      } else {
        responseObject = responseMessage(
          `field ${req.body.rule.field} failed validation.`,
          "error",
          req.body.rule.field,
          tryField,
          ruleCondition,
          ruleConditionValue
        );
        return res.status(400).json(responseObject);
      }
    } else if (ruleCondition === "contains") {
      let tryField;
      if (dataType === "String" || dataType === "Array") {
        let numField = parseInt(ruleField);
        if (numField) {
          tryField = dataBody[numField - 1];
          if (!tryField) {
            responseObject = responseMessage(
              `field ${req.body.rule.field} is missing from data.`,
              "error"
            );
            return res.status(400).json(responseObject);
          }
          if (tryField === ruleConditionValue) {
            responseObject = responseMessage(
              `field ${req.body.rule.field} successfully validated.`,
              "success",
              req.body.rule.field,
              tryField,
              ruleCondition,
              ruleConditionValue
            );
            return res.status(200).json(responseObject);
          } else {
            responseObject = responseMessage(
              `field ${req.body.rule.field} failed validation.`,
              "error",
              req.body.rule.field,
              dataBody[numField],
              ruleCondition,
              ruleConditionValue
            );
            return res.status(400).json(responseObject);
          }
        } else {
          responseObject = responseMessage(
            "Invalid JSON payload passed.",
            "error"
          );
          return res.status(400).json(responseObject);
        }
      } else {
        for (let item in dataBody) {
          if (item === ruleConditionValue) {
            responseObject = responseMessage(
              `value ${req.body.rule.field} successfully validated.`,
              "success",
              req.body.rule.field,
              item,
              ruleCondition,
              ruleConditionValue
            );
            return res.status(200).json(responseObject);
          }
        }
        responseObject = responseMessage(
          `value ${req.body.rule.field} is missing from data.`,
          "error"
        );
        return res.status(400).json(responseObject);
      }
    } else {
      responseObject = responseMessage(
        "condition should be 'eq' | 'neq' | 'gt' | 'gte' | 'contains'.",
        "error"
      );
      res.status(400).json(responseObject);
    }
  } else {
    return res.status(400).json({
      message: "data should be an object | string | Array.",
      status: "error",
      data: null,
    });
  }
});

app.listen(port, () => {
  console.log("Server running on port", port);
});
