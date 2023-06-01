import express, { json } from 'express';
import cors from 'cors';

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';



const PORT = process.env.PORT ?? 3000
const app = express();

app.use(cors({ origin: [`https://localhost:${PORT}`, 'https://chat.openai.com']}));
app.use(json());


app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});


// 1. Preparar los endpoints para servir la información 
// que necesita el Plugin de ChatGPT
app.get('/openapi.yaml', async (req, res, next) => {

    try {
        
        const filePath = path.join(process.cwd(), 'openapi.yaml');
        const yamlData = await fs.readFile(filePath, 'utf8');

        res.setHeader('Content-Type', 'text/yaml');
        res.send(yamlData);

    }   catch(error) {

            console.log(`Error: ${error.message}`);
            res.status(500).send({ error: 'Unable to fetch openai.yaml manifest' });

    }

});

app.get('/.well-known/ai-plugin.json', (req, res) => {
    res.sendFile(path.join(process.cwd(), '.well-known/ai-plugin.json'))
});

app.get('/logo.png', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'logo.png'))
});


// 2. Los endpoints de la API para que funcione
// el Plugin de ChatGPT con los Todos
let TODOS = [
    { id: crypto.randomUUID(), title: 'Terminar Plugin' },
    { id: crypto.randomUUID(), title: 'Subir el proyecto a GitHub' },
    { id: crypto.randomUUID(), title: 'Limpiar codigo' },
    { id: crypto.randomUUID(), title: 'Estudiar 30min Salesforce en Trailhead' }
];


app.get('/todos', (req, res) => {
    res.json({ todos: TODOS });
});

app.post('/todos', (req, res) => {

    const title = req.body;
    const newTodo = { id: crypto.randomUUID(), title };

    TODOS.push(newTodo);
    res.json(newTodo);

});

app.get('/todos/:id', (req, res) => {

    const { id } = req.params;

    const todo = TODOS.find(
        (todo) => todo.id === id
    );

    return res.json(todo);

});

app.put('/todos/:id', (req, res) => {

    const { id } = req.params;
    const { title } = req.body;

    let newTodo = null;

    TODOS.forEach((todo, index) => {
        if(todo.id === id) {
            newTodo = { ...todo, title };
            TODOS[index] = newTodo;
        }
    });

    return res.json(newTodo);

});

app.delete('/todos/:id', (req, res) => {

    const { id } = req.params;

    TODOS = TODOS.filter((todo) => todo.id !== id);
    return res.json({ ok: true });

});


// 3. Iniciar el servidor
app.listen(PORT, () => {
    console.log('ChatGPT Plugin is listening on port', PORT);
});