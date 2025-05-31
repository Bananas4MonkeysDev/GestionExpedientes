// src/main/java/com/example/gestionexpedientesbackend/config/FileHeaderFilter.java
package com.example.gestionexpedientesbackend.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class FileHeaderFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        if (request.getRequestURI().startsWith("/files/")) {
            response.setHeader("X-Frame-Options", "ALLOWALL");
        }

        chain.doFilter(req, res);
    }
}
