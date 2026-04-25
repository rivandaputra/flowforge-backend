import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('step.update', (data) => {
  console.log('STEP:', data);
});

socket.on('run.update', (data) => {
  console.log('RUN:', data);
});
