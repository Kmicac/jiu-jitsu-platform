// Switch to admin database for authentication
db = db.getSiblingDB('admin');
db.auth('admin', 'mongodb123');

// Create notification database and user
db = db.getSiblingDB('notifications_db');
db.createUser({
  user: 'notification_user',
  pwd: 'notification123',
  roles: [
    {
      role: 'readWrite',
      db: 'notifications_db'
    }
  ]
});

// Create analytics database and user (for future use)
db = db.getSiblingDB('analytics_db');
db.createUser({
  user: 'analytics_user',
  pwd: 'analytics123',
  roles: [
    {
      role: 'readWrite',
      db: 'analytics_db'
    }
  ]
});

// Create initial collections and indexes for notifications
db = db.getSiblingDB('notifications_db');

// Email notifications collection
db.createCollection('email_notifications');
db.email_notifications.createIndex({ "userId": 1 });
db.email_notifications.createIndex({ "status": 1 });
db.email_notifications.createIndex({ "createdAt": 1 });
db.email_notifications.createIndex({ "email": 1 });

// SMS notifications collection
db.createCollection('sms_notifications');
db.sms_notifications.createIndex({ "userId": 1 });
db.sms_notifications.createIndex({ "phoneNumber": 1 });
db.sms_notifications.createIndex({ "status": 1 });
db.sms_notifications.createIndex({ "createdAt": 1 });

// Notification templates collection
db.createCollection('notification_templates');
db.notification_templates.createIndex({ "type": 1 });
db.notification_templates.createIndex({ "language": 1 });

print('MongoDB databases and collections initialized successfully!');
