
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Task } from './types';
import TaskItem from './components/TaskItem';
import AddTaskForm from './components/AddTaskForm';
import { BellIcon, CheckCircleIcon } from './components/icons/Icons';

const App: React.FC = () => {
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const requestNotificationPermission = () => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
            });
        }
    };

    const clearTaskTimeout = (task: Task) => {
        if (task.timeoutId) {
            clearTimeout(task.timeoutId);
        }
    };

    const handleAddTask = (text: string, reminder?: string) => {
        if (!text.trim()) return;

        let newTimeoutId: number | undefined = undefined;

        if (reminder) {
            const reminderDate = new Date(reminder);
            const delay = reminderDate.getTime() - new Date().getTime();

            if (delay > 0) {
                newTimeoutId = window.setTimeout(() => {
                    if (Notification.permission === 'granted') {
                        new Notification('To-Do Reminder', {
                            body: text,
                            icon: '/favicon.ico'
                        });
                    }
                }, delay);
            }
        }
        
        const newTask: Task = {
            id: Date.now(),
            text,
            completed: false,
            reminder,
            timeoutId: newTimeoutId
        };

        setTasks(prevTasks => [...prevTasks, newTask]);
    };
    
    const handleToggleTask = (id: number) => {
        setTasks(prevTasks =>
            prevTasks.map(task => {
                if (task.id === id) {
                    // If completing a task, clear its reminder timeout
                    if (!task.completed) {
                        clearTaskTimeout(task);
                    }
                    return { ...task, completed: !task.completed, timeoutId: undefined };
                }
                return task;
            })
        );
    };

    const handleDeleteTask = (id: number) => {
        const taskToDelete = tasks.find(task => task.id === id);
        if (taskToDelete) {
            clearTaskTimeout(taskToDelete);
        }
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    };
    
    // Cleanup timeouts when component unmounts
    useEffect(() => {
        return () => {
            tasks.forEach(clearTaskTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks]);

    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);

    return (
        <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
            <header className="w-full max-w-4xl mx-auto p-4 sm:p-6 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">TaskFlow</h1>
                <p className="text-slate-400 mt-2">Your daily tasks, with a reminder boost.</p>
            </header>

            <main className="flex-grow w-full max-w-2xl mx-auto p-4 pb-32">
                {notificationPermission !== 'granted' && (
                    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg relative mb-6 flex items-center justify-between">
                        <span className="block sm:inline">Enable notifications for reminders.</span>
                        <button 
                            onClick={requestNotificationPermission}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-1 px-3 rounded text-sm"
                            disabled={notificationPermission === 'denied'}
                        >
                            {notificationPermission === 'denied' ? 'Permission Denied' : 'Enable'}
                        </button>
                    </div>
                )}

                {tasks.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-slate-600" />
                        <h2 className="mt-4 text-2xl font-semibold text-slate-300">All tasks completed!</h2>
                        <p className="text-slate-500 mt-1">Add a new task to get started.</p>
                    </div>
                ) : (
                    <>
                        {activeTasks.length > 0 && (
                             <div className="mb-8">
                                <h2 className="text-xl font-semibold text-slate-300 mb-3 px-1">To-Do</h2>
                                <div className="space-y-3">
                                    {activeTasks.map(task => (
                                        <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
                                    ))}
                                </div>
                            </div>
                        )}
                       
                        {completedTasks.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-slate-300 mb-3 px-1">Completed</h2>
                                <div className="space-y-3">
                                    {completedTasks.map(task => (
                                        <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700">
                <div className="max-w-2xl mx-auto p-4">
                    <AddTaskForm onAddTask={handleAddTask} />
                </div>
            </footer>
        </div>
    );
};

export default App;
