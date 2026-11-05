package domain

import "errors"

// ErrNotFound means the requested entity does not exist.
var ErrNotFound = errors.New("entity not found")
