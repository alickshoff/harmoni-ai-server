require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Эндпоинт для чата
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Поле "messages" должно быть массивом' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiMessage = response.data.choices[0].message;
    res.json({ choices: [{ message: aiMessage }] });

  } catch (error) {
    console.error('OpenAI Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Ошибка при обращении к OpenAI',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Проверка
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер Harmoni работает!' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});