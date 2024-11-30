UserModel

{
  "_id": ObjectId, // Unique identifier for each user
  "name": "string", // Full name of the user
  "email": "string", // Email address
  "phone": "string", // Optional contact number
  "profilePicture": "string" // URL for the user's profile picture (optional)
}



GruopModel
{
  "_id": ObjectId, // Unique identifier for the group
  "name": "string", // Name of the group
  "createdBy": ObjectId, // Reference to the _id of the user who created the group
  "members": [
    {
      "userId": ObjectId, // Reference to the user who is a member
      "balance": {
        "toPay": [
          {
            "payeeId": ObjectId, // User who is to be paid
            "amount": "number" // Amount to pay
          }
        ],
        "toReceive": [
          {
            "payerId": ObjectId, // User who owes money
            "amount": "number" // Amount to receive
          }
        ]
      }
    }
  ],
  "totalBalance": {
    "toPay": "number", // Total amount the group needs to pay
    "toReceive": "number" // Total amount the group is owed
  },
  "expenses": [ObjectId], // References to associated expenses
  "createdAt": Date // Timestamp when the group was created
}




ExpenseModel

{
  "_id": ObjectId, // Unique identifier for each expense
  "groupId": ObjectId, // Reference to the _id of the group
  "createdBy": ObjectId, // Reference to the _id of the user who created the expense
  "title": "string", // Short description of the expense
  "totalAmount": "number", // Total amount of the expense
  "date": "Date", // Date when the expense occurred
  "createdAt": "Date", // Timestamp when the expense was added
  "splitDetails": [
    {
      "payerId": ObjectId, // Reference to the _id of the user who paid
      "payeeId": ObjectId, // Reference to the _id of the user who owes money
      "amount": "number" // Amount owed by the payee to the payer
    }
  ]
}