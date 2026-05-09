import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';
import apiClient from '../utils/apiClient';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #2c3e50;
`;

const CreateRoomButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b;
  }
`;

const RoomList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const RoomCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const RoomName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
`;

const RoomInfo = styled.p`
  margin: 0.25rem 0;
  color: #7f8c8d;
`;

const JoinButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;

  &:hover {
    background-color: #2980b9;
  }
`;

const LobbyPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    
    if (socket) {
      socket.on('room_list_updated', (updatedRooms) => {
        setRooms(updatedRooms);
      });
      
      socket.on('room_created', (room) => {
        setRooms(prev => [...prev, room]);
        toast.success('房间创建成功');
      });
      
      socket.on('error', (error) => {
        toast.error(error.message);
      });
    }
    
    return () => {
      if (socket) {
        socket.off('room_list_updated');
        socket.off('room_created');
        socket.off('error');
      }
    };
  }, [socket]);

  const fetchRooms = async () => {
    try {
      const response = await apiClient.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      toast.error('获取房间列表失败');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = () => {
    const roomName = prompt('请输入房间名称');
    if (roomName && roomName.trim()) {
      if (socket) {
        socket.emit('create_room', { roomName: roomName.trim() });
      }
    }
  };

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join_room', { roomId });
      navigate(`/room/${roomId}`);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <Container>
      <Header>
        <Title>游戏大厅</Title>
        <CreateRoomButton onClick={createRoom}>创建房间</CreateRoomButton>
      </Header>
      
      <RoomList>
        {rooms.map(room => (
          <RoomCard key={room.id}>
            <RoomName>{room.name}</RoomName>
            <RoomInfo>房间ID: {room.id}</RoomInfo>
            <RoomInfo>玩家: {room.players.length}/6</RoomInfo>
            <RoomInfo>状态: {room.status}</RoomInfo>
            <JoinButton 
              onClick={() => joinRoom(room.id)}
              disabled={room.players.length >=