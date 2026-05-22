package com.ytnafrica.backend.repository;

import com.ytnafrica.backend.model.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {
    Optional<Artist> findByEmail(String email);
    Optional<Artist> findByArtistNameIgnoreCase(String artistName);
}
