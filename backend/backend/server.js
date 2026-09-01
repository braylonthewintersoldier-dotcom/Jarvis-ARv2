import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";


dotenv.config();


const app =
    express();


app.use(
    cors({
        origin: "*"
    })
);


app.use(
    express.json({
        limit: "2mb"
    })
);


const client =
    new OpenAI({
        apiKey:
            process.env.OPENAI_API_KEY
    });


const PORT =
    process.env.PORT || 10000;


// ======================================
// HEALTH
// ======================================

app.get(
    "/",
    (req, res) => {

        res.json({
            status:
                "JARVIS backend online"
        });

    }
);


// ======================================
// JARVIS
// ======================================

app.post(
    "/api/jarvis",
    async (req, res) => {

        try {

            const message =
                String(
                    req.body.message || ""
                );


            const scene =
                req.body.scene || {};


            if(!message) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Missing message."
                    });

            }


            const systemPrompt = `

You are JARVIS, an AI assistant controlling a 3D AR modeling environment.

Your job is to understand the user's natural language and return:
1. A short helpful reply.
2. Commands that modify the 3D scene.

AVAILABLE OBJECT TYPES:
cube
sphere
cylinder
pyramid
torus

AVAILABLE COMMANDS:

CREATE:
{
  "action":"CREATE",
  "type":"cube",
  "position":{"x":0,"y":0,"z":0},
  "scale":1,
  "name":"Cube"
}

DELETE:
{
  "action":"DELETE"
}

DUPLICATE:
{
  "action":"DUPLICATE"
}

MOVE:
{
  "action":"MOVE",
  "position":{"x":0,"y":0,"z":0}
}

SCALE:
{
  "action":"SCALE",
  "amount":2
}

ROTATE:
{
  "action":"ROTATE",
  "rotation":{"x":0,"y":0,"z":0}
}

PHYSICS:
{
  "action":"PHYSICS",
  "enabled":true
}

CLEAR:
{
  "action":"CLEAR"
}

SELECT:
{
  "action":"SELECT",
  "index":0
}

IMPORTANT:

Return ONLY valid JSON.

The JSON must have this exact structure:

{
  "reply":"short response",
  "commands":[]
}

If the user asks for a complex object, break it into multiple primitive objects.

For example, if the user says:
"build me a simple car"

create several objects such as:

body
roof
four wheels

Use multiple CREATE commands.

Keep the reply short.

Current scene:

${JSON.stringify(scene)}

User request:

${message}

`;


            const response =
                await client.responses.create({

                    model:
                        process.env.OPENAI_MODEL ||
                        "gpt-5",

                    input:
                        systemPrompt

                });


            let output =
                response.output_text;


            output =
                output
                    .replace(
                        /^```json/i,
                        ""
                    )
                    .replace(
                        /^```/i,
                        ""
                    )
                    .replace(
                        /```$/i,
                        ""
                    )
                    .trim();


            let parsed;


            try {

                parsed =
                    JSON.parse(
                        output
                    );

            }
            catch {

                parsed = {

                    reply:
                        output,

                    commands: []

                };

            }


            res.json({

                reply:
                    parsed.reply ||
                    "Done.",

                commands:
                    Array.isArray(
                        parsed.commands
                    )
                        ? parsed.commands
                        : []

            });

        }
        catch(error) {

            console.error(
                error
            );


            res.status(500)
                .json({

                    error:
                        "JARVIS backend error."

                });

        }

    }
);


// ======================================
// START
// ======================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `JARVIS running on port ${PORT}`
        );

    }
);
