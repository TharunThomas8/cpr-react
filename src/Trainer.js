import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api_base } from './config';

const Trainer = () => {
    const [trainerId, setTrainerId] = useState(sessionStorage.getItem('trainerId') || '');
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(true);

    const handleInputChange = (event) => {
        setTrainerId(event.target.value);
    };

    const handleNewUserChange = (event) => {
        setNewUser(event.target.value);
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/get-users/${trainerId}`);
            const responseData = response.data;
            if (responseData.success) {
                setUsers(responseData.users);
                setShowForm(false);
            } else {
                setError(responseData.message);
            }
        } catch (error) {
            setError('An error occurred while fetching users.');
        } finally {
            setIsLoading(false);
        }
    };

    const addUser = async () => {
        try {
            const response = await axios.post(`${api_base}/add-user`, {
                trainerId,
                userId: newUser
            });
            const responseData = response.data;
            if (responseData.success) {
                setNewUser('');
                setUsers([...users, newUser]);
            } else {
                if (responseData.message === 'User already exists') {
                    alert('User already exists');
                } else {
                    setError(responseData.message);
                }
            }
        } catch (error) {
            setError('An error occurred while adding the user.');
        }
    };


    const changeTrainerId = () => {
        setShowForm(true);
        setUsers([]);
        setTrainerId('');
    };

    useEffect(() => {
        // Check if userId exists in sessionStorage
        const storedUserId = sessionStorage.getItem('trainerId');
        if (storedUserId) {
            setTrainerId(storedUserId);
            fetchUsers();
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem('trainerId', trainerId);
    }, [trainerId]);

    return (
        <div>
            <h2>Users under Trainer</h2>
            {showForm ? (
                <div>
                    <input type="text" value={trainerId} onChange={handleInputChange} />
                    <button onClick={fetchUsers}>Fetch Users</button>
                </div>
            ) : (
                <div>
                    <button onClick={changeTrainerId}>Change Trainer ID</button>
                    <br />
                    <input type="text" value={newUser} onChange={handleNewUserChange} />
                    <button onClick={addUser}>Add User</button>
                </div>
            )}
            {isLoading ? (
                <div>Loading...</div>
            ) : error ? (
                <div>Error: {error}</div>
            ) : users.length > 0 ? (
                <ul>
                    {users.map((user, index) => (
                        <li key={index}>
                            <Link to={`/report/${user}`}>{user}</Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div>No users found.</div>
            )}
            <Link to="/">Go Back</Link>
        </div>
    );
};

export default Trainer;
