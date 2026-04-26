package com.yourpath.ai;

public class Message {
    private String text;
    private boolean isUser;
    private long timestamp;

    public Message(String text, boolean isUser) {
        this.text = text;
        this.isUser = isUser;
        this.timestamp = System.currentTimeMillis();
    }

    public String getText() {
        return text;
    }

    public boolean isUser() {
        return isUser;
    }

    public long getTimestamp() {
        return timestamp;
    }
}
