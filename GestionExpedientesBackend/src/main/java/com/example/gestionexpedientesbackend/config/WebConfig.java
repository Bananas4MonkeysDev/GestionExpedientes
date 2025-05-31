// File: WebConfig.java
package com.example.gestionexpedientesbackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Para los archivos de cargos
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:///C:/Users/Usuario/Desktop/CargoUploads/");

        // Para los archivos de expedientes
        registry.addResourceHandler("/expedientes/**")
                .addResourceLocations("file:///C:/Users/Usuario/Desktop/ExpedientesUploads/");
    }
}
