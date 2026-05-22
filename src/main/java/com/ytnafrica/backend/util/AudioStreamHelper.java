package com.ytnafrica.backend.util;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Efficient MP3 streaming with HTTP Range support for fast start on slow networks.
 */
public final class AudioStreamHelper {

    private static final int STREAM_BUFFER_SIZE = 32 * 1024;
    private static final MediaType AUDIO_MPEG = MediaType.parseMediaType("audio/mpeg");
    private static final String CACHE_CONTROL = "public, max-age=86400, immutable";

    private AudioStreamHelper() {}

    public static ResponseEntity<StreamingResponseBody> streamFile(File file, String rangeHeader) {
        if (file == null || !file.exists() || !file.isFile()) {
            return ResponseEntity.notFound().build();
        }

        long fileLength = file.length();
        if (fileLength <= 0) {
            return ResponseEntity.notFound().build();
        }

        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            try {
                long[] range = parseRange(rangeHeader, fileLength);
                long rangeStart = range[0];
                long rangeEnd = range[1];
                long contentLength = rangeEnd - rangeStart + 1;

                StreamingResponseBody body = outputStream -> streamBytes(file, rangeStart, contentLength, outputStream);

                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .contentType(AUDIO_MPEG)
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .header(HttpHeaders.CONTENT_RANGE,
                                String.format("bytes %d-%d/%d", rangeStart, rangeEnd, fileLength))
                        .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                        .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL)
                        .body(body);
            } catch (NumberFormatException ignored) {
                // Fall through to full file
            }
        }

        StreamingResponseBody body = outputStream -> streamBytes(file, 0, fileLength, outputStream);

        return ResponseEntity.ok()
                .contentType(AUDIO_MPEG)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileLength))
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL)
                .body(body);
    }

    private static void streamBytes(File file, long offset, long length, java.io.OutputStream outputStream)
            throws IOException {
        try (InputStream in = new FileInputStream(file)) {
            skipBytes(in, offset);
            byte[] buffer = new byte[STREAM_BUFFER_SIZE];
            long remaining = length;
            while (remaining > 0) {
                int toRead = (int) Math.min(buffer.length, remaining);
                int read = in.read(buffer, 0, toRead);
                if (read <= 0) {
                    break;
                }
                outputStream.write(buffer, 0, read);
                remaining -= read;
            }
            outputStream.flush();
        }
    }

    private static long[] parseRange(String rangeHeader, long fileLength) {
        String[] parts = rangeHeader.substring(6).split("-");
        long start = Long.parseLong(parts[0].trim());
        long end = parts.length > 1 && !parts[1].isEmpty()
                ? Long.parseLong(parts[1].trim())
                : fileLength - 1;
        if (start < 0) {
            start = 0;
        }
        if (end >= fileLength) {
            end = fileLength - 1;
        }
        if (start > end) {
            start = 0;
            end = fileLength - 1;
        }
        return new long[]{start, end};
    }

    private static void skipBytes(InputStream in, long bytesToSkip) throws IOException {
        long skipped = in.skip(bytesToSkip);
        long remaining = bytesToSkip - skipped;
        byte[] buf = new byte[STREAM_BUFFER_SIZE];
        while (remaining > 0) {
            int read = in.read(buf, 0, (int) Math.min(buf.length, remaining));
            if (read <= 0) {
                break;
            }
            remaining -= read;
        }
    }
}
