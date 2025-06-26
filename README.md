# TeeTime Finder

## Overview

The **TeeTime Finder** is a simple bot designed to help golfers in Vancouver, BC, find available tee times at local golf courses. It addresses the challenges of booking tee times, especially during peak hours, by focusing on times that are within a 5-day window, which typically do not incur a booking fee.

## Why This Project Was Created

Finding a tee time at local golf courses in Vancouver can be quite challenging, particularly during the prime hours of 4-6 PM when prices are lower. Many golfers face stiff competition for these coveted slots, and the added complexity of booking fees for reservations made over 5 days in advance makes the process even more frustrating.

The **TeeTime Finder** bot is developed to simplify this process by:

- **Identifying Available Tee Times**: The bot scans for available tee times within the next 5 days, ensuring you can book without incurring extra fees.
- **Streamlining the Booking Process**: By automating the search for available slots, the bot saves you time and effort, allowing you to focus on your game rather than the booking logistics.
- **Text Notifications**: Integrated with Twilio, the bot can send you SMS notifications when a desired tee time becomes available.

## Features

- **Search for Tee Times**: Quickly find available tee times at local golf courses.
- **No Booking Fees**: Focuses on times that can be booked without additional fees.
- **User-Friendly**: Designed to make the booking process as easy as possible.
- **SMS Notifications**: Receive text alerts via Twilio when new tee times are found.

## Getting Started

To use the TeeTime Finder, clone the repository and run the bot using Node.js. Make sure to have the necessary dependencies installed.

### Prerequisites

- Node.js (version X.X or higher)
- Twilio account for SMS notifications
- Any additional dependencies specified in `package.json`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/davidwxcui/teetime-finder.git
   ```
2. Navigate to the project directory:
   ```bash
   cd teetime-finder
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Set up your Twilio account and obtain your Account SID, Auth Token, and a phone number for sending messages.
2. Create a `.env` file in the project root and add the following variables:
   ```plaintext
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   YOUR_PHONE_NUMBER=your_personal_phone_number
   ```

### Usage

Run the bot with the following command:
```bash
node bot.js
```
You will receive SMS notifications whenever a desired tee time becomes available.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.


