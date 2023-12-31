import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api_base } from './config';
import './Trainer.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSpinner } from '@fortawesome/free-solid-svg-icons';

const Trainer = () => {
    const [trainerId, setTrainerId] = useState(sessionStorage.getItem('trainerId') || '');
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(true);
    const [isAddingUser, setIsAddingUser] = useState(false);


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
            const response = await axios.get(api_base + 'get-users/' + trainerId);
            const responseData = response.data;
            if (responseData.success) {
                setUsers(responseData.users);
                setShowForm(false);
            } else {
                console.log("ERROR HERE?");
                console.log(responseData);
                setError(responseData.message);
            }
        } catch (error) {
            setError('An error occurred while fetching users.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const addUser = async () => {
        setIsAddingUser(true);
        try {
            const response = await axios.post(api_base + 'add-user', {
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
            setIsAddingUser(false);
        } catch (error) {
            setIsAddingUser(false);
            setError('An error occurred while adding the user.');
        }
    };


    const changeTrainerId = () => {
        setShowForm(true);
        setUsers([]);
        setTrainerId('');
    };

    useEffect(() => {
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
            <Link to="/landing"><button className='button'><FontAwesomeIcon icon={faHome} /></button></Link>
            {showForm ? (
                <div>
                    <input className='input-container' placeholder='Enter Trainer ID' type="text" value={trainerId} onChange={handleInputChange} />
                    <button className='button' onClick={fetchUsers}>Fetch Users</button>
                </div>
            ) : (
                <div>
                    <button className='button' onClick={changeTrainerId}>Change Trainer ID</button>
                    <br />
                    <input className='input-container' placeholder='Enter New User ID' type="text" value={newUser} onChange={handleNewUserChange} />
                    <button className='button' onClick={addUser}>Add User</button>
                    <p>Users under Trainer {trainerId}</p>
                </div>
            )}
            {isLoading ? (
                <div>Loading...</div>
            ) : error ? (
                <div>Error: {error}</div>
            ) : users.length > 0 ? (
                <>
                    <ul>
                        {users.map((user, index) => (
                            <li key={index}>
                                <Link to={`/report/${user}`}>{user}</Link>
                            </li>
                        ))}
                        {isAddingUser && (
                            <div>
                                <center>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                {' Adding user...'}
                                </center>
                            </div>
                        )}
                    </ul>

                    <Link to={`/leaderboard`} >
                        <button className='button' >Leaderboard</button>
                    </Link>

                </>
            ) : (
                <p>No users assigned.</p>
            )}

        </div>
    );
};

export default Trainer;
