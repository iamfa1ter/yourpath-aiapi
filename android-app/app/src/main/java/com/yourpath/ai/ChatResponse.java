package com.yourpath.ai;

public class ChatResponse {
    private Reply reply;
    private String error;

    public Reply getReply() {
        return reply;
    }

    public String getError() {
        return error;
    }

    public static class Reply {
        private String content;

        public String getContent() {
            return content;
        }
    }
}
