const mysql = require('mysql2/promise');

async function migrate() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'fors_simulator'
    });

    try {
        console.log("Creating Conversations table...");
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS Conversations (
                conversation_id VARCHAR(50) PRIMARY KEY,
                ticket_id VARCHAR(50) NOT NULL,
                user_matricule VARCHAR(50),
                title VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Creating Messages table...");
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS Messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                conversation_id VARCHAR(50) NOT NULL,
                user_matricule VARCHAR(50),
                role ENUM('User', 'AI') NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES Conversations(conversation_id) ON DELETE CASCADE
            )
        `);

        console.log("Migrating old chat_history data...");
        // Assuming discussion_id might be empty, we could group by ticket_id and create a conversation for each if discussion_id is null.
        // Actually, discussion_id is already in chat_history. Let's construct a conversation for each existing distinct ticket_id or discussion_id.
        const [oldChats] = await conn.execute(`SELECT * FROM chat_history`);
        if (oldChats.length > 0) {
            console.log("Found old chats, migrating...");
            for (let chat of oldChats) {
                let convId = chat.discussion_id;
                if (!convId) {
                    convId = chat.ticket_id + "_old";
                }

                // Ensure conversation exists
                await conn.execute(`INSERT IGNORE INTO Conversations (conversation_id, ticket_id, user_matricule) VALUES (?, ?, ?)`, [convId, chat.ticket_id, chat.user_matricule]);
                
                let role = chat.role === 'assistant' ? 'AI' : 'User';

                await conn.execute(`INSERT INTO Messages (conversation_id, user_matricule, role, content, created_at) VALUES (?, ?, ?, ?, ?)`, [convId, chat.user_matricule, role, chat.content, chat.created_at]);
            }
        }

        console.log("Migration done.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await conn.end();
    }
}

migrate();
