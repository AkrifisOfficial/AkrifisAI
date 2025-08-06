import React, { useState, useRef } from 'react';
import axios from 'axios';

const AIAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Добавляем сообщение пользователя
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    const userInput = input;
    setInput('');
    
    try {
      // Отправляем запрос на бэкенд
      const response = await axios.post(`${API_URL}/chat`, { prompt: userInput });
      
      // Добавляем ответ ИИ
      setMessages(prev => [...prev, { 
        text: response.data.response, 
        sender: 'ai' 
      }]);
      
      // Если запрос на генерацию изображения
      if (userInput.toLowerCase().includes('нарисуй')) {
        const imgResponse = await axios.post(`${API_URL}/generate-image`, {
          prompt: userInput
        });
        setImageUrl(imgResponse.data.image_url);
      }
    } catch (error) {
      console.error('Ошибка API:', error);
    }
  };

  const startRecording = async () => {
    if (navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];
        
        mediaRecorder.current.ondataavailable = (e) => {
          audioChunks.current.push(e.data);
        };
        
        mediaRecorder.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          await sendAudioToServer(audioBlob);
        };
        
        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Ошибка доступа к микрофону:', err);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    try {
      const response = await axios.post(`${API_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setInput(response.data.text);
    } catch (error) {
      console.error('Ошибка транскрипции:', error);
    }
  };

  return (
    <div className="ai-assistant">
      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {imageUrl && (
          <div className="ai-image">
            <img src={imageUrl} alt="AI Generated" />
          </div>
        )}
      </div>
      
      <div className="input-container">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Задайте вопрос..."
        />
        
        <button onClick={handleSend}>Отправить</button>
        
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? 'recording' : ''}
        >
          {isRecording ? '⏹️ Стоп' : '🎤 Голос'}
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
