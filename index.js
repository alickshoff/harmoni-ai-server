// index.js — Сервер для Harmoni AI (Node.js + Express)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Порт: от Render или локально 5000
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*' // Можно ограничить: ['https://your-app.com']
}));
app.use(express.json({ limit: '10mb' }));

// Логирование запросов (опционально)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- Эндпоинт: /chat ---
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // Валидация
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Поле "messages" обязательно и должно быть массивом'
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({
        error: 'Массив сообщений не может быть пустым'
      });
    }

    // Запрос к OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0,
        frequency_penalty: 0.5
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000 // 15 секунд
      }
    );

    // Ответ от OpenAI
    const aiMessage = response.data.choices[0]?.message;

    if (!aiMessage) {
      throw new Error('Нет ответа от ИИ');
    }

    res.json({ choices: [{ message: aiMessage }] });

  } catch (error) {
    console.error('Ошибка в /chat:', error.message);

    // Классификация ошибок
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Таймаут: ИИ не ответил вовремя' });
    }

    if (error.response) {
      // Ошибки от OpenAI (400, 401, 429 и т.д.)
      const status = error.response.status;
      const message = error.response.data.error?.message || 'Неизвестная ошибка OpenAI';

      return res.status(status).json({ error: `OpenAI: ${message}` });
    }

    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

// --- Эндпоинт: /health (проверка работоспособности) ---
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Сервер Harmoni работает!',
    timestamp: new Date().toISOString()
  });
});

// --- Обработка 404 ---
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Эндпоинт не найден' });
});

// --- Запуск сервера ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`💡 Доступ: http://localhost:${PORT}/health`);
});

// --- Экспорт для тестов (опционально) ---
module.exports = app;

